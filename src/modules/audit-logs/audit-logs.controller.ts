import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AdminAuthGuard } from "../../auth/guards/admin-auth.guard";
import { UsersApiClient } from "../../infrastructure/users-api/users-api.client";
import { AuditLogsService } from "./audit-logs.service";

@ApiTags("audit-logs")
@ApiBearerAuth()
@UseGuards(AdminAuthGuard)
@Controller("admin/audit-logs")
export class AuditLogsController {
  constructor(
    private readonly auditLogsService: AuditLogsService,
    private readonly usersApiClient: UsersApiClient,
  ) {}

  @Get()
  @ApiOperation({ summary: "Listar logs de auditoría" })
  async list(@Req() request: Request) {
    const logs = await this.auditLogsService.list();

    const authHeader = request.headers.authorization;
    const accessToken = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : undefined;

    if (!accessToken || logs.length === 0) {
      return logs;
    }

    try {
      const users = await this.usersApiClient.listUsers(accessToken);
      const userMap = new Map(users.map((u) => [u.id, u]));

      return logs.map((log: any) => {
        const user = userMap.get(log.actorId);
        return {
          ...log,
          actorEmail: log.metadata?.actorEmail ?? user?.email ?? null,
          actorName: log.metadata?.actorName ?? user?.nombreCompleto ?? null,
        };
      });
    } catch {
      return logs;
    }
  }
}
