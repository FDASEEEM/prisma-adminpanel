import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminAuthGuard } from "../../auth/guards/admin-auth.guard";
import { ColegioStatsService } from "./colegio-stats.service";

@ApiTags("colegio-stats")
@ApiBearerAuth()
@UseGuards(AdminAuthGuard)
@Controller("admin/colegio-stats")
export class ColegioStatsController {
  constructor(private readonly colegioStatsService: ColegioStatsService) {}

  @Get(":colegioId/professors")
  @ApiOperation({ summary: "Estadísticas de profesores de un colegio" })
  async getProfessorsStats(@Param("colegioId", new ParseUUIDPipe()) colegioId: string) {
    return this.colegioStatsService.getProfessorsStats(colegioId);
  }

  @Get(":colegioId/info")
  @ApiOperation({ summary: "Información básica de un colegio" })
  async getColegioInfo(@Param("colegioId", new ParseUUIDPipe()) colegioId: string) {
    return this.colegioStatsService.getColegioBasicInfo(colegioId);
  }

  @Get(":colegioId/consumo")
  @ApiOperation({ summary: "Estadísticas de consumo de sesiones de un colegio" })
  async getColegioConsumo(@Param("colegioId", new ParseUUIDPipe()) colegioId: string) {
    return this.colegioStatsService.getColegioConsumoStats(colegioId);
  }

  @Get(":colegioId/full")
  @ApiOperation({ summary: "Estadísticas completas de un colegio (profesores + consumo)" })
  async getColegioFullStats(@Param("colegioId", new ParseUUIDPipe()) colegioId: string) {
    return this.colegioStatsService.getColegioFullStats(colegioId);
  }
}
