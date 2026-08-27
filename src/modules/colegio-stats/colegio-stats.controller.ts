import { Controller, ForbiddenException, Get, Param, ParseUUIDPipe, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AdminAuthGuard } from "../../auth/guards/admin-auth.guard";
import { ColegioStatsService } from "./colegio-stats.service";

type AdminUser = { id: string; email?: string; role?: string; colegioId?: string | null };

@ApiTags("colegio-stats")
@ApiBearerAuth()
@UseGuards(AdminAuthGuard)
@Controller("admin/colegio-stats")
export class ColegioStatsController {
  constructor(private readonly colegioStatsService: ColegioStatsService) {}

  private assertColegioAccess(request: Request & { adminUser?: AdminUser }, colegioId: string) {
    const admin = request.adminUser;
    // Un ADMIN sólo puede consultar su propio colegio; el cross-colegio es de SUPERADMIN.
    if (admin && admin.role === "ADMIN" && admin.colegioId && admin.colegioId !== colegioId) {
      throw new ForbiddenException("You cannot access stats of another colegio.");
    }
  }

  @Get(":colegioId/professors")
  @ApiOperation({ summary: "Estadísticas de profesores de un colegio" })
  async getProfessorsStats(
    @Param("colegioId", new ParseUUIDPipe()) colegioId: string,
    @Req() request: Request & { adminUser?: AdminUser },
  ) {
    this.assertColegioAccess(request, colegioId);
    return this.colegioStatsService.getProfessorsStats(colegioId);
  }

  @Get(":colegioId/info")
  @ApiOperation({ summary: "Información básica de un colegio" })
  async getColegioInfo(
    @Param("colegioId", new ParseUUIDPipe()) colegioId: string,
    @Req() request: Request & { adminUser?: AdminUser },
  ) {
    this.assertColegioAccess(request, colegioId);
    return this.colegioStatsService.getColegioBasicInfo(colegioId);
  }

  @Get(":colegioId/consumo")
  @ApiOperation({ summary: "Estadísticas de consumo de sesiones de un colegio" })
  async getColegioConsumo(
    @Param("colegioId", new ParseUUIDPipe()) colegioId: string,
    @Req() request: Request & { adminUser?: AdminUser },
  ) {
    this.assertColegioAccess(request, colegioId);
    return this.colegioStatsService.getColegioConsumoStats(colegioId);
  }

  @Get(":colegioId/full")
  @ApiOperation({ summary: "Estadísticas completas de un colegio (profesores + consumo)" })
  async getColegioFullStats(
    @Param("colegioId", new ParseUUIDPipe()) colegioId: string,
    @Req() request: Request & { adminUser?: AdminUser },
  ) {
    this.assertColegioAccess(request, colegioId);
    return this.colegioStatsService.getColegioFullStats(colegioId);
  }
}
