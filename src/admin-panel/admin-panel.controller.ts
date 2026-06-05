import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AdminAuthGuard } from "../auth/guards/admin-auth.guard";
import { AuditLogsService } from "../modules/audit-logs/audit-logs.service";
import { AdminPanelService } from "./admin-panel.service";

@ApiTags("admin-panel")
@ApiBearerAuth()
@UseGuards(AdminAuthGuard)
@Controller("admin")
export class AdminPanelController {
  constructor(
    private readonly adminPanelService: AdminPanelService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  @Get("dashboard/summary")
  @ApiOperation({ summary: "Resumen de KPIs del panel de administración" })
  async dashboardSummary(@Req() request: Request & { adminUser?: { id: string; email?: string; nombreCompleto?: string } }) {
    const adminUser = request.adminUser;
    if (adminUser) {
      this.auditLogsService.create(adminUser, "dashboard_view", "dashboard", undefined, {
        ipAddress: request.ip ?? request.socket.remoteAddress,
      });
    }
    return this.adminPanelService.getDashboardSummary(adminUser?.id);
  }

  @Get("me")
  @ApiOperation({ summary: "Perfil admin autenticado" })
  me(@Req() request: Request & { adminUser?: { id: string; email?: string } }) {
    return request.adminUser;
  }
}
