import { Test, TestingModule } from "@nestjs/testing";
import { ProfessorsController } from "./professors.controller";
import { ProfessorsService } from "./professors.service";
import { AdminAuthGuard } from "../../auth/guards/admin-auth.guard";

const mockProfessorsService = () => ({
  list: jest.fn(),
  get: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

describe("ProfessorsController", () => {
  let controller: ProfessorsController;
  let service: ReturnType<typeof mockProfessorsService>;
  const actor = { id: "u1", email: "u@u.com", name: "User" };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfessorsController],
      providers: [{ provide: ProfessorsService, useFactory: mockProfessorsService }],
    })
      .overrideGuard(AdminAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ProfessorsController>(ProfessorsController);
    service = module.get(ProfessorsService) as any;
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("list", () => {
    it("should delegate to service using adminUser colegioId", () => {
      service.list.mockReturnValue([{ id: "p1" }]);
      const request: any = { adminUser: { id: "u1", colegioId: "c1" } };

      const result = controller.list({ page: 1 } as any, request);

      expect(service.list).toHaveBeenCalledWith({ page: 1 }, "c1");
      expect(result).toEqual([{ id: "p1" }]);
    });

    it("should pass undefined colegioId when no adminUser", () => {
      service.list.mockReturnValue([]);

      controller.list({ page: 1 } as any, {} as any);

      expect(service.list).toHaveBeenCalledWith({ page: 1 }, undefined);
    });
  });

  describe("get", () => {
    it("should delegate to service", () => {
      service.get.mockReturnValue({ id: "p1" });
      expect(controller.get("p1")).toEqual({ id: "p1" });
      expect(service.get).toHaveBeenCalledWith("p1");
    });
  });

  describe("create", () => {
    it("should extract token, default colegioId, and delegate to service", () => {
      const dto: any = { email: "p@p.com" };
      service.create.mockReturnValue({ id: "p1" });
      const request: any = {
        headers: { authorization: "Bearer token123" },
        adminUser: { id: "u1", email: "u@u.com", nombreCompleto: "User", colegioId: "c1" },
      };

      const result = controller.create(dto, request);

      expect(dto.colegioId).toBe("c1");
      expect(service.create).toHaveBeenCalledWith(dto, actor, "token123");
      expect(result).toEqual({ id: "p1" });
    });

    it("should not override colegioId when already set on dto", () => {
      const dto: any = { email: "p@p.com", colegioId: "existing" };
      service.create.mockReturnValue({ id: "p1" });
      const request: any = { headers: {}, adminUser: { id: "u1", colegioId: "c1" } };

      controller.create(dto, request);

      expect(dto.colegioId).toBe("existing");
    });

    it("should work without auth header or adminUser", () => {
      const dto: any = { email: "p@p.com" };
      service.create.mockReturnValue({ id: "p1" });
      const request: any = { headers: {} };

      controller.create(dto, request);

      expect(service.create).toHaveBeenCalledWith(dto, undefined, undefined);
    });
  });

  describe("update", () => {
    it("should delegate to service with actor", () => {
      const dto = { email: "new@p.com" } as any;
      service.update.mockReturnValue({ id: "p1" });
      const request: any = { adminUser: { id: "u1", email: "u@u.com", nombreCompleto: "User" } };

      const result = controller.update("p1", dto, request);

      expect(service.update).toHaveBeenCalledWith("p1", dto, actor);
      expect(result).toEqual({ id: "p1" });
    });
  });

  describe("delete", () => {
    it("should delegate to service with actor", () => {
      service.delete.mockReturnValue({ id: "p1" });
      const request: any = { adminUser: { id: "u1", email: "u@u.com", nombreCompleto: "User" } };

      const result = controller.delete("p1", request);

      expect(service.delete).toHaveBeenCalledWith("p1", actor);
      expect(result).toEqual({ id: "p1" });
    });
  });
});
