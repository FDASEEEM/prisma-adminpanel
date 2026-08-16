# CLAUDE.md — prisma-adminpanel

> Contexto interno para sesiones de Claude Code trabajando **solo en este repo**. Para el mapa completo
> del sistema P.R.I.S.M.A. (los demás microservicios, el front, el motor de IA) ver el `CLAUDE.md` en la
> raíz del workspace (`EP2/CLAUDE.md`).

## 1. Rol de este repo

API del **panel de administración** de P.R.I.S.M.A. (NestJS 10 + Prisma 5, puerto **3004**, prefijo global
`/api`). Gestiona: profesores, tickets de soporte (+ respuestas), materiales de recurso, anuncios, sesiones
admin (activas/bloqueadas/históricas), notificaciones y estadísticas por colegio. Toda acción relevante
queda auditada en `admin_audit_logs`.

**No tiene identidad propia.** No conoce Supabase, no emite ni valida JWT por sí mismo, no tiene
`SUPABASE_SERVICE_ROLE_KEY`. Para todo lo relacionado con auth delega en `prisma-ms-users` vía HTTP
(`USERS_SERVICE_URL`). Tampoco crea usuarios: cuando el flujo de "crear profesor" necesita un usuario nuevo,
le pide a `ms-users` que lo cree.

Usa **esquema Prisma por defecto** (no `multiSchema`; a diferencia de `ms-users`/`ms-docs`).

## 2. Stack y estructura

- NestJS 10, Prisma 5 (`@prisma/client` ^5.22), `class-validator`/`class-transformer` con
  `ValidationPipe({ whitelist: true, transform: true })` global.
- Swagger en `/docs` (`ApiBearerAuth`, título "P.R.I.S.M.A. Admin Panel").
- CORS vía `CORS_ORIGIN` (default `http://localhost:3002,http://127.0.0.1:3002`), `credentials: true`.
- Sin librería de auth propia (no Passport, no JWT local): la validación de rol se hace llamando a otro
  servicio (ver §5).

```
src/
  main.ts                        # bootstrap, prefijo /api, CORS, Swagger /docs
  app.controller.ts              # GET /health (público, sin prefijo /admin)
  app.module.ts                  # ensambla todos los módulos
  admin-panel/                   # GET /api/admin/dashboard/summary, /api/admin/me
  auth/
    roles.service.ts             # assertAdmin(token) -> llama ms-users /auth/me
    guards/admin-auth.guard.ts   # AdminAuthGuard: exige Bearer + rol admin, audita "login"
  infrastructure/
    prisma/                      # PrismaService (no conecta en NODE_ENV=test)
    users-api/                   # UsersApiClient: HTTP a ms-users (USERS_SERVICE_URL)
    jobs-api/                    # JobsApiClient: HTTP a ms-docs (DOCS_SERVICE_URL)
  modules/
    professors/                  # CRUD profesores; create() puede delegar en ms-users
    tickets/                     # tickets + respuestas; notifica al cerrar
    resources/                   # materiales de recurso
    announcements/                # anuncios (con endpoint público /active)
    sessions/                    # sesiones admin: activas/bloqueadas/históricas
    notifications/               # notificaciones por usuario (sin guard)
    audit-logs/                  # AuditLogsService.create(); listado enriquecido con ms-users
    colegio-stats/               # agrega Prisma local (Professor) + ms-docs (jobs stats)
```

## 3. Modelo de datos (`prisma/schema.prisma`)

Tablas reales (todas con `@@map` a snake_case):

- **`admin_audit_logs`** (`AdminAuditLog`): `actor_id`, `action` (enum `AdminAuditAction`), `entity`,
  `entity_id?`, `metadata` (Json?), `created_at`. Índices por `actorId`, `action`, `createdAt`.
- **`support_tickets`** (`SupportTicket`): `requester_id`, `subject`, `message`, `status` (enum
  `TicketStatus`: `open|in_progress|closed`, default `open`), `priority` (enum `TicketPriority`:
  `low|medium|high`, default `medium`), `assigned_to?`, `closed_at?`. Relación 1:N con
  **`support_ticket_replies`** (`SupportTicketReply`: `ticket_id`, `author_id`, `message`).
- **`resource_materials`** (`ResourceMaterial`): `title`, `description?`, `type` (enum `ResourceType`:
  `file|link|video|document`), `url`, `uploaded_by`.
- **`announcements`** (`Announcement`): `title`, `body`, `audience` (enum `AnnouncementAudience`:
  `all|teachers|admins`), `is_active`, `starts_at?`, `ends_at?`, `created_by`.
- **`professors`** (`Professor`): `user_id` (único, es el id de Supabase que devuelve ms-users),
  `nombre_completo`, `email`, `especialidad?`, `telefono?`, `colegio_id?` (UUID, agregado en migración
  `20260615000000_add_colegio_to_professors`), `is_active`.
- **`admin_sessions`** (`AdminSession`): `user_id`, `token_hash`, `user_agent?`, `ip_address?`,
  `is_active`, `is_blocked`, `last_access`, `expires_at`.
- **`notifications`** (`Notification`): `user_id`, `title`, `message`, `ticket_id?`, `read`.

Enum `AdminAuditAction` incluye `colegio_create/update/delete` (agregados en la misma migración que
`colegio_id`) **pero ningún controlador de este repo los emite** — no hay módulo CRUD de colegios aquí.
Quedaron reservados para una futura gestión de colegios (o son emitidos por otro servicio que escribe
directo en esta tabla). No asumas que existe un endpoint `/admin/colegios`.

## 4. Endpoints por módulo

Todos bajo prefijo global `/api`. `[guard]` = requiere `AdminAuthGuard` (Bearer + rol admin).

**Admin panel** (`admin-panel.controller.ts`)
- `GET /admin/dashboard/summary` `[guard]` — KPIs (tickets abiertos, anuncios activos, total recursos,
  profesores activos, sesiones activas) + últimos 5 tickets. Audita `dashboard_view`.
- `GET /admin/me` `[guard]` — devuelve el `adminUser` resuelto por el guard.

**Profesores** (`professors.controller.ts`, base `/admin/professors`) — todo `[guard]`
- `GET /` — lista paginada; si el admin autenticado tiene `colegioId`, filtra automáticamente por ese
  colegio (scoping implícito, no lo decide el query param).
- `GET /:id`
- `POST /` — crea profesor (ver §6). Si el DTO no trae `colegioId`, hereda el del admin autenticado.
- `PATCH /:id`
- `DELETE /:id`

**Tickets** (`tickets.controller.ts`, base `/admin/tickets`)
- `GET /` `[guard]` — lista paginada, ordenada por prioridad desc luego fecha desc.
- `GET /by-requester/:requesterId` — **público, sin guard** (pensado para que el front del profesor
  consulte sus propios tickets sin pasar por admin).
- `GET /:id` `[guard]` — incluye `replies`.
- `POST /` — **público, sin guard** (cualquiera puede abrir un ticket).
- `PATCH /:id` `[guard]` — actualiza estado/prioridad/asignación; si trae `message`, crea una
  `SupportTicketReply`; si pasa a `closed`, notifica al `requesterId` (ver `notifications.service.ts`).
- `DELETE /:id` `[guard]`

**Recursos** (`resources.controller.ts`, base `/admin/resources`) — todo `[guard]`
- `GET /`, `POST /`, `PATCH /:id`, `DELETE /:id`.

**Anuncios** (`announcements.controller.ts`, base `/admin/announcements`)
- `GET /` `[guard]`
- `GET /active` — **público**, para que el front muestre anuncios vigentes sin login.
- `POST /` `[guard]`, `PATCH /:id` `[guard]`, `DELETE /:id` `[guard]`.

**Sesiones** (`sessions.controller.ts`, base `/admin/sessions`) — todo `[guard]`
- `GET /active`, `GET /historical` (inactivas u bloqueadas), `GET /blocked`, `GET /user/:userId`
- `POST /` — registra una sesión (`tokenHash`, `expiresAt`, etc.)
- `PUT /:id/block` — bloquea (`isBlocked=true, isActive=false`), audita `session_block`
- `PUT /:id/unblock` — desbloquea (`isBlocked=false, isActive=true`), audita `session_unblock`
- `PUT /:id/terminate` — sólo `isActive=false` (no toca `isBlocked`), audita `session_terminate`
- `POST /cleanup` — marca `isActive=false` todas las sesiones con `expiresAt < now`. No audita.

**Notificaciones** (`notifications.controller.ts`, base `/notifications` — **no** `/admin/notifications**)
**Sin `AdminAuthGuard` en ningún endpoint.** Identifica al usuario únicamente por `?userId=` en query.
- `GET /?userId=` , `GET /unread?userId=`, `PATCH /:id/read`.

**Audit logs** (`audit-logs.controller.ts`, base `/admin/audit-logs`) — `[guard]`
- `GET /` — lista todos los logs; si hay Bearer token, enriquece cada log con `actorEmail`/`actorName`
  llamando `ms-users` `listUsers()` (fallback silencioso a los logs crudos si esa llamada falla).

**Colegio stats** (`colegio-stats.controller.ts`, base `/admin/colegio-stats`) — `[guard]`, params
validados con `ParseUUIDPipe`
- `GET /:colegioId/professors` — conteos locales (Prisma) de profesores por colegio.
- `GET /:colegioId/info` — toma el primer `Professor` de ese colegio como "info básica" (nombre/email);
  **no hay tabla `Colegio` en este repo** — el "colegio" es un concepto externo, sólo referenciado por
  `professors.colegio_id`.
- `GET /:colegioId/consumo` — delega en `ms-docs` vía `JobsApiClient` (ver §7, `DOCS_SERVICE_URL`).
- `GET /:colegioId/full` — combina profesores + consumo.

## 5. Auth: cómo valida rol contra ms-users

`src/auth/guards/admin-auth.guard.ts` (`AdminAuthGuard`, `CanActivate`):
1. Exige header `Authorization: Bearer <token>`; si falta, `401 Missing or invalid authorization header`.
2. Llama `RolesService.assertAdmin(token)` (`src/auth/roles.service.ts`), que a su vez llama
   `UsersApiClient.getCurrentUser(token)` → `GET ${USERS_SERVICE_URL}/auth/me` con ese Bearer.
3. `RolesService` acepta rol `"ADMIN"` **o `"SUPERADMIN"`** (no sólo `ADMIN` — hay un rol superior no
   documentado en el CLAUDE.md raíz del workspace). Si el rol no es uno de esos dos, lanza
   `InternalServerErrorException("Admin role required.")`.
4. **Gotcha:** el guard envuelve la llamada a `assertAdmin` en un `try/catch` genérico y en cualquier
   error (sea 401 real de ms-users, 500 de rol inválido, timeout de red, etc.) responde siempre
   `401 Invalid admin credentials.` — el motivo real del rechazo (rol insuficiente vs. token inválido vs.
   ms-users caído) se pierde para el cliente; sólo aparece en logs si se agregan.
5. Si pasa, adjunta `request.adminUser = { id, email, nombreCompleto, colegioId, role }` (el shape que
   devuelva `ms-users /auth/me`) y sólo **entonces** audita un evento `login` (deduplicado: no crea otro
   `login` si ya hay uno del mismo `actorId` en los últimos 5 minutos — `LOGIN_DEDUP_MS`).
6. El guard se aplica **por endpoint o por controller**, no globalmente (`app.module.ts` no lo registra
   como `APP_GUARD`). Varios endpoints son deliberadamente públicos (ver tabla de §4): creación de
   tickets, consulta de tickets por requester, anuncios activos, y **todo el módulo de notificaciones**.

`USERS_SERVICE_URL` debe incluir el prefijo `/api` de ms-users (`http://localhost:3001/api`), porque el
cliente concatena rutas relativas (`/auth/me`, `/admin/users`) directamente.

## 6. Cómo crea profesores (delega en ms-users)

`ProfessorsService.create()` (`src/modules/professors/professors.service.ts`):
- Si el DTO no trae `userId` pero sí `email` + `nombreCompleto`, llama
  `UsersApiClient.createProfessorUser(...)` → `POST ${USERS_SERVICE_URL}/admin/users` con
  `{ email, nombreCompleto, password, role: role ?? "TEACHER", colegioId }`, reenviando el `accessToken`
  del admin que hizo la petición (el controller lo extrae del header `Authorization` de la request
  entrante y se lo pasa explícitamente al service — no hay contexto de request implícito).
- Esta llamada es la que realmente crea el usuario en Supabase + el perfil en `ms-users` (este repo nunca
  toca Supabase). Si `ms-users` responde `!ok` o `!data.ok`, lanza `InternalServerErrorException`.
- Recién con el `userId` devuelto crea la fila local en `professors`.
- Si no hay `userId` ni (`email`+`nombreCompleto`), lanza `NotFoundException("userId or email+nombreCompleto is required.")`
  — mensaje algo engañoso para un caso de validación de entrada (debería ser 400, no 404).
- Auditoría `teacher_create` sólo se registra si hay `actor` (viene del `adminUser` del guard).

## 7. Llamadas salientes a otros servicios

Dos clientes HTTP en `src/infrastructure/`, ambos usando `fetch` global (sin retry/timeout propio):

- **`UsersApiClient`** (`users-api/users-api.client.ts`) → `USERS_SERVICE_URL`
  - `getCurrentUser(token)` → `GET /auth/me`
  - `createProfessorUser(dto, token?)` → `POST /admin/users`
  - `listUsers(token)` → `GET /admin/users` (usado sólo por `audit-logs` para enriquecer nombres/emails)
- **`JobsApiClient`** (`jobs-api/jobs-api.client.ts`) → `DOCS_SERVICE_URL` (⚠️ variable no documentada en
  el CLAUDE.md raíz del workspace — apunta a `prisma-ms-docs`, puerto 3000)
  - `getColegioStats(colegioId)` → `GET /api/jobs/colegio/:colegioId/stats` (nota: el path completo
    incluye `/api`, a diferencia de `USERS_SERVICE_URL` que ya trae `/api` en el valor de la variable).
    Usado sólo por `colegio-stats`.

Si `USERS_SERVICE_URL` o `DOCS_SERVICE_URL` faltan, ambos clientes lanzan `InternalServerErrorException`
inmediatamente (fail-fast, no hay valor por defecto hardcodeado).

## 8. Auditoría (`admin_audit_logs`)

`AuditLogsService.create(actor, action, entity, entityId?, metadata?)`
(`src/modules/audit-logs/audit-logs.service.ts`):
- `actor` puede ser un `string` (sólo id) o un `ActorInfo { id, name?, email? }`. Cuando es `ActorInfo`,
  `name`/`email` se inyectan dentro de `metadata` como `actorName`/`actorEmail` (no son columnas propias).
- Si `metadata` queda vacío, se guarda `Prisma.JsonNull` explícito (no `undefined`).
- Se invoca desde, como mínimo: guard (`login`), `admin-panel.controller` (`dashboard_view`),
  `professors.service` (`teacher_create/update/delete`), `tickets.service` (`ticket_create/reply/
  status_change/delete` — nota: cambio de prioridad también dispara `ticket_status_change`, no hay acción
  dedicada `ticket_priority_change`), `resources.service`, `announcements.service`,
  `sessions.controller` (`session_block/unblock/terminate`, llamado desde el controller, no desde el
  service — `sessions.service` no conoce `AuditLogsService`).
- `GET /admin/audit-logs` enriquece cada fila con `actorEmail`/`actorName`: primero mira si ya están en
  `metadata` (los que se auditaron con `ActorInfo`), si no, hace fallback a una llamada a
  `ms-users.listUsers()` y cruza por `actorId`. Si esa llamada falla, devuelve los logs sin enriquecer
  (no rompe la respuesta).
- No hay paginación en `AuditLogsService.list()` — trae **todos** los logs siempre (`findMany` sin
  `take`/`skip`). Ojo si la tabla crece.

## 9. Variables de entorno (`.env.example`)

```env
PORT=3004
CORS_ORIGIN=http://localhost:3002,http://127.0.0.1:3002

DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
USERS_SERVICE_URL=http://localhost:3001/api    # incluye el prefijo /api de ms-users
DOCS_SERVICE_URL=http://localhost:3000         # ms-docs, para colegio-stats (sin /api en la var)
```

No hay ninguna variable de Supabase en este repo — coherente con que no gestiona identidad.

## 10. Comandos

```bash
npm install
npx prisma generate
npx prisma migrate dev            # crea/aplica migración en desarrollo
npx prisma migrate deploy         # aplica migraciones en producción (fuera de la imagen Docker)
npm run start:dev                 # watch mode, alias: npm run dev
npm run start:prod                # node dist/main
npm run build                     # nest build
npm test                          # Jest, específicamente src/**/*.spec.ts (rootDir: "src" en package.json)
npm run test:e2e                  # Jest con test/jest-e2e.json
```

No hay script `lint` en `package.json` (a diferencia de otros repos NestJS de P.R.I.S.M.A.).

## 11. Gotchas / cosas no obvias

- **Rol aceptado por el guard es `ADMIN` o `SUPERADMIN`**, no sólo `ADMIN` como sugiere el mapa general
  del workspace. `RolesService.assertAdmin` compara contra ambos strings.
- **El guard oculta la causa real del rechazo**: cualquier excepción dentro de `assertAdmin` (incluida
  la `InternalServerErrorException` por rol insuficiente) se convierte en `401 Invalid admin credentials`
  genérico por el `catch` de `admin-auth.guard.ts`.
- **Endpoints deliberadamente públicos** (sin `AdminAuthGuard`): `POST /admin/tickets` (crear ticket),
  `GET /admin/tickets/by-requester/:id`, `GET /admin/announcements/active`, y **todo**
  `/notifications/*`. Este último no filtra por identidad real: cualquiera que conozca un `userId` puede
  leer/marcar como leídas sus notificaciones vía query param — no hay verificación de que el caller sea
  ese usuario.
- **`Professor.colegioId` filtra automáticamente el listado** (`GET /admin/professors`): si el admin
  autenticado tiene `colegioId` en su perfil (viene de `ms-users`), el listado se acota a ese colegio sin
  que el cliente lo pida explícitamente; un `SUPERADMIN` sin `colegioId` ve todos.
- **No existe modelo `Colegio` en este repo.** Es un id externo (probablemente de `ms-users` o de un
  futuro servicio de colegios) que sólo se referencia desde `professors.colegio_id`. Los "stats de
  colegio" (`GET /admin/colegio-stats/:id/info`) se infieren tomando el primer profesor con ese
  `colegioId` — es una aproximación, no una fuente de verdad de colegios.
- **`AdminAuditAction` tiene `colegio_create/update/delete` sin ningún emisor en este código** — quedaron
  de la migración `20260615000000_add_colegio_to_professors` pero no hay controller que gestione colegios
  aquí; no asumir que existe ese CRUD.
- **`PrismaService.onModuleInit` no conecta si `NODE_ENV=test`** — los tests unitarios (`*.spec.ts`)
  mockean Prisma en vez de usar una base real; revisar los `.spec.ts` existentes como referencia antes de
  escribir tests nuevos que dependan de una BD real.
- **`sessions.service.terminate()` sólo pone `isActive=false`**, no toca `isBlocked` (a diferencia de
  `block()` que sí pone ambos). Una sesión terminada pero no bloqueada podría reactivarse con `unblock()`
  aunque nunca estuvo bloqueada — revisar la intención antes de tocar este flujo.
- **`POST /admin/sessions/cleanup` no genera entrada de auditoría**, a diferencia de block/unblock/
  terminate que sí la generan (desde el controller, no el service).
- **`AuditLogsService.list()` no pagina** — trae la tabla completa. Los módulos de `professors`,
  `tickets`, `announcements` y `resources` sí tienen `PaginationDto` (page/limit, default `limit=50`).
- **Creación de profesor por `email`+`nombreCompleto` reenvía el `accessToken` del request original a
  ms-users** — si cambia el contrato de `POST /admin/users` en `ms-users` (p. ej. deja de aceptar ese
  Bearer, o cambia el shape de `{ ok, user }`), este flujo rompe en silencio hasta que se prueba
  manualmente (no hay tests de integración contra `ms-users` real, sólo unit tests con mocks).
- El `Dockerfile` corre `npx prisma generate` en el build stage pero **las migraciones se aplican aparte**
  (`npx prisma migrate deploy`, fuera de la imagen) — no asumir que levantar el contenedor migra la BD.
