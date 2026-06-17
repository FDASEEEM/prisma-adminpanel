import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { JobsApiClient, ColegioJobsStats } from "../../infrastructure/jobs-api/jobs-api.client";

@Injectable()
export class ColegioStatsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jobsApiClient: JobsApiClient,
  ) {}

  async getProfessorsStats(colegioId: string) {
    const [totalProfessors, activeProfessors, inactiveProfessors] = await Promise.all([
      this.prisma.professor.count({ where: { colegioId } }),
      this.prisma.professor.count({ where: { colegioId, isActive: true } }),
      this.prisma.professor.count({ where: { colegioId, isActive: false } }),
    ]);

    return {
      totalProfessors,
      activeProfessors,
      inactiveProfessors,
    };
  }

  async getColegioBasicInfo(colegioId: string) {
    const profesor = await this.prisma.professor.findFirst({
      where: { colegioId },
      select: {
        nombreCompleto: true,
        email: true,
      },
    });

    if (!profesor) {
      throw new NotFoundException("No se encontró información del colegio");
    }

    return {
      colegioId,
      primerAdmin: profesor,
    };
  }

  async getColegioConsumoStats(colegioId: string): Promise<ColegioJobsStats> {
    return this.jobsApiClient.getColegioStats(colegioId);
  }

  async getColegioFullStats(colegioId: string) {
    const [professorsStats, consumoStats] = await Promise.all([
      this.getProfessorsStats(colegioId),
      this.getColegioConsumoStats(colegioId),
    ]);

    return {
      colegioId,
      profesores: professorsStats,
      consumo: consumoStats,
    };
  }
}
