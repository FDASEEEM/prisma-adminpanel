import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { AdminAuditAction } from "@prisma/client";
import { Request } from "express";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { RolesService } from "../roles.service";

const LOGIN_DEDUP_MS = 5 * 60 * 1000;

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(
    private readonly rolesService: RolesService,
    private readonly prisma: PrismaService,
  ) {}

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

      await this.logLogin(adminUser, request, accessToken);

      return true;
    } catch {
      throw new UnauthorizedException("Invalid admin credentials.");
    }
  }

  private async logLogin(adminUser: { id: string; email?: string; nombreCompleto?: string }, request: Request, token: string) {
    const fiveMinAgo = new Date(Date.now() - LOGIN_DEDUP_MS);
    const recentLogin = await this.prisma.adminAuditLog.findFirst({
      where: {
        actorId: adminUser.id,
        action: "login" as AdminAuditAction,
        createdAt: { gte: fiveMinAgo },
      },
      orderBy: { createdAt: "desc" },
    });

    if (recentLogin) return;

    await this.prisma.adminAuditLog.create({
      data: {
        actorId: adminUser.id,
        action: "login" as AdminAuditAction,
        entity: "auth",
        metadata: {
          actorEmail: adminUser.email ?? null,
          actorName: adminUser.nombreCompleto ?? null,
          ipAddress: request.ip ?? request.socket.remoteAddress ?? null,
          userAgent: request.headers["user-agent"] ?? null,
        },
      },
    });
  }
}
