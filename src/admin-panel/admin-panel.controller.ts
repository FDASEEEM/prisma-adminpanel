import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AdminAuthGuard } from "../auth/guards/admin-auth.guard";
import { AdminPanelService } from "./admin-panel.service";

@ApiTags("admin-panel")
@ApiBearerAuth()
@UseGuards(AdminAuthGuard)
@Controller("admin")
export class AdminPanelController {
  constructor(private readonly adminPanelService: AdminPanelService) {}

  @Get("dashboard/summary")
  @ApiOperation({ summary: "Resumen de KPIs del panel de administración" })
  dashboardSummary(@Req() request: Request & { adminUser?: { id: string; email?: string } }) {
    return this.adminPanelService.getDashboardSummary(request.adminUser?.id);
  }

  @Get("me")
  @ApiOperation({ summary: "Perfil admin autenticado" })
  me(@Req() request: Request & { adminUser?: { id: string; email?: string } }) {
    return request.adminUser;
  }
}
