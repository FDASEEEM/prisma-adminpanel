import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Request } from "express";
import { RolesService } from "../roles.service";

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

    try {
      const adminUser = await this.rolesService.assertAdmin(accessToken);
      (request as any).adminUser = adminUser;
      return true;
    } catch {
      throw new UnauthorizedException("Invalid admin credentials.");
    }
  }
}
