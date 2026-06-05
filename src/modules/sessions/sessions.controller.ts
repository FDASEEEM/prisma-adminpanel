import { Body, Controller, Get, Param, Post, Put, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AdminAuditAction } from "@prisma/client";
import { AdminAuthGuard } from "../../auth/guards/admin-auth.guard";
import { CreateSessionDto } from "./dto/create-session.dto";
import { SessionsService } from "./sessions.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";

type AdminUser = { id: string; email?: string; nombreCompleto?: string };

@ApiTags("sessions")
@ApiBearerAuth()
@UseGuards(AdminAuthGuard)
@Controller("admin/sessions")
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService, private readonly auditLogs: AuditLogsService) {}

  @Get("active")
  @ApiOperation({ summary: "Listar sesiones activas" })
  listActive() { return this.sessionsService.listActive(); }

  @Get("historical")
  @ApiOperation({ summary: "Listar sesiones históricas" })
  listHistorical() { return this.sessionsService.listHistorical(); }

  @Get("blocked")
  @ApiOperation({ summary: "Listar sesiones bloqueadas" })
  listBlocked() { return this.sessionsService.listBlocked(); }

  @Get("user/:userId")
  @ApiOperation({ summary: "Listar sesiones de un usuario" })
  listByUser(@Param("userId") userId: string) { return this.sessionsService.listByUser(userId); }

  @Post()
  @ApiOperation({ summary: "Registrar nueva sesión" })
  create(@Body() dto: CreateSessionDto) { return this.sessionsService.create(dto); }

  @Put(":id/block")
  @ApiOperation({ summary: "Bloquear sesión" })
  async block(@Param("id") id: string, @Req() request: Request & { adminUser?: AdminUser }) {
    const session = await this.sessionsService.block(id);
    if (request.adminUser) await this.auditLogs.create({ id: request.adminUser.id, email: request.adminUser.email, name: request.adminUser.nombreCompleto }, AdminAuditAction.session_block, "AdminSession", id, { userId: session.userId });
    return session;
  }

  @Put(":id/unblock")
  @ApiOperation({ summary: "Desbloquear sesión" })
  async unblock(@Param("id") id: string, @Req() request: Request & { adminUser?: AdminUser }) {
    const session = await this.sessionsService.unblock(id);
    if (request.adminUser) await this.auditLogs.create({ id: request.adminUser.id, email: request.adminUser.email, name: request.adminUser.nombreCompleto }, AdminAuditAction.session_unblock, "AdminSession", id, { userId: session.userId });
    return session;
  }

  @Put(":id/terminate")
  @ApiOperation({ summary: "Terminar sesión" })
  async terminate(@Param("id") id: string, @Req() request: Request & { adminUser?: AdminUser }) {
    const session = await this.sessionsService.terminate(id);
    if (request.adminUser) await this.auditLogs.create({ id: request.adminUser.id, email: request.adminUser.email, name: request.adminUser.nombreCompleto }, AdminAuditAction.session_terminate, "AdminSession", id, { userId: session.userId });
    return session;
  }

  @Post("cleanup")
  @ApiOperation({ summary: "Limpiar sesiones expiradas" })
  cleanupExpired() { return this.sessionsService.cleanupExpired(); }
}
