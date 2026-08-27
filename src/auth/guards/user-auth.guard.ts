import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Request } from "express";
import { UsersApiClient } from "../../infrastructure/users-api/users-api.client";

/**
 * Valida que la request traiga un JWT de un usuario autenticado en ms-users.
 * No restringe por rol: sirve para endpoints que pueden usar docentes (TEACHER)
 * además de admins (p. ej. tickets, notificaciones propias).
 *
 * Adjunta `request.user` con el perfil resuelto desde `ms-users /auth/me`.
 * Deja propagar el error real de `UsersApiClient` (401 token inválido vs.
 * 502/503 users-service caído) en vez de enmascararlo como un 401 genérico.
 */
@Injectable()
export class UserAuthGuard implements CanActivate {
  constructor(private readonly usersApiClient: UsersApiClient) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing or invalid authorization header.");
    }

    const accessToken = authHeader.split(" ")[1];
    (request as any).user = await this.usersApiClient.getCurrentUser(accessToken);
    return true;
  }
}
