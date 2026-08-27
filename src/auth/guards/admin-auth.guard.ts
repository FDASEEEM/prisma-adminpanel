import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Request } from "express";
import { RolesService } from "../roles.service";

/**
 * Exige Bearer + rol ADMIN/SUPERADMIN (resuelto contra ms-users).
 * No escribe en BD por request: el registro de "login" pertenece al endpoint
 * de login real, no a cada request autenticada.
 */
@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private readonly rolesService: RolesService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing or invalid authorization header.");
    }

    const accessToken = authHeader.split(" ")[1];

    // Dejamos propagar el error real: 401 (token inválido), 403 (sin rol admin)
    // o 502/503 (users-service caído) en lugar de enmascararlo como un 401 genérico.
    const adminUser = await this.rolesService.assertAdmin(accessToken);
    (request as any).adminUser = adminUser;

    return true;
  }
}
