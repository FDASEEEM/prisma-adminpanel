import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { JobsApiClient } from "../../infrastructure/jobs-api/jobs-api.client";
import { ColegioStatsService } from "./colegio-stats.service";

const mockPrismaService = () => ({
  professor: { count: jest.fn(), findFirst: jest.fn() },
});

const mockJobsApiClient = () => ({ getColegioStats: jest.fn() });

describe("ColegioStatsService", () => {
  let service: ColegioStatsService;
  let prisma: ReturnType<typeof mockPrismaService>;
  let jobsApiClient: ReturnType<typeof mockJobsApiClient>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ColegioStatsService,
        { provide: PrismaService, useFactory: mockPrismaService },
        { provide: JobsApiClient, useFactory: mockJobsApiClient },
      ],
    }).compile();

    service = module.get<ColegioStatsService>(ColegioStatsService);
    prisma = module.get(PrismaService) as any;
    jobsApiClient = module.get(JobsApiClient) as any;
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getProfessorsStats", () => {
    it("should aggregate professor counts", async () => {
      prisma.professor.count.mockResolvedValueOnce(10).mockResolvedValueOnce(7).mockResolvedValueOnce(3);

      const result = await service.getProfessorsStats("c1");

      expect(prisma.professor.count).toHaveBeenCalledWith({ where: { colegioId: "c1" } });
      expect(prisma.professor.count).toHaveBeenCalledWith({ where: { colegioId: "c1", isActive: true } });
      expect(prisma.professor.count).toHaveBeenCalledWith({ where: { colegioId: "c1", isActive: false } });
      expect(result).toEqual({ totalProfessors: 10, activeProfessors: 7, inactiveProfessors: 3 });
    });
  });

  describe("getColegioBasicInfo", () => {
    it("should return basic info when professor found", async () => {
      const profesor = { nombreCompleto: "Prof", email: "p@p.com" };
      prisma.professor.findFirst.mockResolvedValue(profesor as any);

      const result = await service.getColegioBasicInfo("c1");

      expect(prisma.professor.findFirst).toHaveBeenCalledWith({
        where: { colegioId: "c1" },
        select: { nombreCompleto: true, email: true },
      });
      expect(result).toEqual({ colegioId: "c1", primerAdmin: profesor });
    });

    it("should throw NotFoundException when no professor found", async () => {
      prisma.professor.findFirst.mockResolvedValue(null);

      await expect(service.getColegioBasicInfo("c1")).rejects.toThrow(NotFoundException);
    });
  });

  describe("getColegioConsumoStats", () => {
    it("should delegate to jobsApiClient", async () => {
      const stats = { totalJobs: 1, completedJobs: 1, failedJobs: 0, pendingJobs: 0, processingJobs: 0 };
      jobsApiClient.getColegioStats.mockResolvedValue(stats);

      const result = await service.getColegioConsumoStats("c1");

      expect(jobsApiClient.getColegioStats).toHaveBeenCalledWith("c1");
      expect(result).toEqual(stats);
    });
  });

  describe("getColegioFullStats", () => {
    it("should combine professor stats and consumo stats", async () => {
      prisma.professor.count.mockResolvedValueOnce(10).mockResolvedValueOnce(7).mockResolvedValueOnce(3);
      const consumo = { totalJobs: 1, completedJobs: 1, failedJobs: 0, pendingJobs: 0, processingJobs: 0 };
      jobsApiClient.getColegioStats.mockResolvedValue(consumo);

      const result = await service.getColegioFullStats("c1");

      expect(result).toEqual({
        colegioId: "c1",
        profesores: { totalProfessors: 10, activeProfessors: 7, inactiveProfessors: 3 },
        consumo,
      });
    });
  });
});
