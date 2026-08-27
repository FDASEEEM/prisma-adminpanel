import { Test, TestingModule } from "@nestjs/testing";
import { ColegioStatsController } from "./colegio-stats.controller";
import { ColegioStatsService } from "./colegio-stats.service";
import { AdminAuthGuard } from "../../auth/guards/admin-auth.guard";

const mockColegioStatsService = () => ({
  getProfessorsStats: jest.fn(),
  getColegioBasicInfo: jest.fn(),
  getColegioConsumoStats: jest.fn(),
  getColegioFullStats: jest.fn(),
});

describe("ColegioStatsController", () => {
  let controller: ColegioStatsController;
  let service: ReturnType<typeof mockColegioStatsService>;
  const colegioId = "11111111-1111-1111-1111-111111111111";
  const superadminRequest: any = { adminUser: { id: "sa1", role: "SUPERADMIN" } };
  const adminMyColegioRequest: any = { adminUser: { id: "a1", role: "ADMIN", colegioId } };
  const adminOtherColegioRequest: any = { adminUser: { id: "a1", role: "ADMIN", colegioId: "22222222-2222-2222-2222-222222222222" } };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ColegioStatsController],
      providers: [{ provide: ColegioStatsService, useFactory: mockColegioStatsService }],
    })
      .overrideGuard(AdminAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ColegioStatsController>(ColegioStatsController);
    service = module.get(ColegioStatsService) as any;
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("should throw ForbiddenException when an ADMIN queries another colegio", async () => {
    await expect(controller.getProfessorsStats(colegioId, adminOtherColegioRequest)).rejects.toThrow();
    expect(service.getProfessorsStats).not.toHaveBeenCalled();
  });

  describe("getProfessorsStats", () => {
    it("should delegate to service", async () => {
      const expected = { totalProfessors: 1, activeProfessors: 1, inactiveProfessors: 0 };
      service.getProfessorsStats.mockResolvedValue(expected);

      const result = await controller.getProfessorsStats(colegioId, superadminRequest);

      expect(service.getProfessorsStats).toHaveBeenCalledWith(colegioId);
      expect(result).toEqual(expected);
    });

    it("should allow an ADMIN to query its own colegio", async () => {
      const expected = { totalProfessors: 1, activeProfessors: 1, inactiveProfessors: 0 };
      service.getProfessorsStats.mockResolvedValue(expected);

      const result = await controller.getProfessorsStats(colegioId, adminMyColegioRequest);

      expect(service.getProfessorsStats).toHaveBeenCalledWith(colegioId);
      expect(result).toEqual(expected);
    });
  });

  describe("getColegioInfo", () => {
    it("should delegate to service", async () => {
      const expected = { colegioId, primerAdmin: {} };
      service.getColegioBasicInfo.mockResolvedValue(expected);

      const result = await controller.getColegioInfo(colegioId, superadminRequest);

      expect(service.getColegioBasicInfo).toHaveBeenCalledWith(colegioId);
      expect(result).toEqual(expected);
    });
  });

  describe("getColegioConsumo", () => {
    it("should delegate to service", async () => {
      const expected = { totalJobs: 1 };
      service.getColegioConsumoStats.mockResolvedValue(expected);

      const result = await controller.getColegioConsumo(colegioId, superadminRequest);

      expect(service.getColegioConsumoStats).toHaveBeenCalledWith(colegioId);
      expect(result).toEqual(expected);
    });
  });

  describe("getColegioFullStats", () => {
    it("should delegate to service", async () => {
      const expected = { colegioId, profesores: {}, consumo: {} };
      service.getColegioFullStats.mockResolvedValue(expected);

      const result = await controller.getColegioFullStats(colegioId, superadminRequest);

      expect(service.getColegioFullStats).toHaveBeenCalledWith(colegioId);
      expect(result).toEqual(expected);
    });
  });
});
