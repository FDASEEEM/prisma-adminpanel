import { Test, TestingModule } from "@nestjs/testing";
import { TicketsController } from "./tickets.controller";
import { TicketsService } from "./tickets.service";
import { AdminAuthGuard } from "../../auth/guards/admin-auth.guard";

const mockTicketsService = () => ({
  list: jest.fn(),
  listByRequester: jest.fn(),
  get: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

describe("TicketsController", () => {
  let controller: TicketsController;
  let service: ReturnType<typeof mockTicketsService>;
  const request: any = { adminUser: { id: "u1", email: "u@u.com", nombreCompleto: "User" } };
  const actor = { id: "u1", email: "u@u.com", name: "User" };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TicketsController],
      providers: [{ provide: TicketsService, useFactory: mockTicketsService }],
    })
      .overrideGuard(AdminAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<TicketsController>(TicketsController);
    service = module.get(TicketsService) as any;
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("list", () => {
    it("should delegate to service", () => {
      service.list.mockReturnValue([{ id: "t1" }]);
      expect(controller.list({ page: 1 } as any)).toEqual([{ id: "t1" }]);
      expect(service.list).toHaveBeenCalledWith({ page: 1 });
    });
  });

  describe("listByRequester", () => {
    it("should delegate to service", () => {
      service.listByRequester.mockReturnValue([{ id: "t1" }]);
      expect(controller.listByRequester("r1")).toEqual([{ id: "t1" }]);
      expect(service.listByRequester).toHaveBeenCalledWith("r1");
    });
  });

  describe("get", () => {
    it("should delegate to service", () => {
      service.get.mockReturnValue({ id: "t1" });
      expect(controller.get("t1")).toEqual({ id: "t1" });
      expect(service.get).toHaveBeenCalledWith("t1");
    });
  });

  describe("create", () => {
    it("should delegate to service", () => {
      const dto = { subject: "S" } as any;
      service.create.mockReturnValue({ id: "t1" });
      expect(controller.create(dto)).toEqual({ id: "t1" });
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe("update", () => {
    it("should delegate to service with actor", () => {
      const dto = { status: "closed" } as any;
      service.update.mockReturnValue({ id: "t1" });

      const result = controller.update("t1", dto, request);

      expect(service.update).toHaveBeenCalledWith("t1", dto, actor);
      expect(result).toEqual({ id: "t1" });
    });

    it("should delegate to service without actor when no adminUser", () => {
      const dto = { status: "closed" } as any;
      service.update.mockReturnValue({ id: "t1" });

      controller.update("t1", dto, {} as any);

      expect(service.update).toHaveBeenCalledWith("t1", dto, undefined);
    });
  });

  describe("delete", () => {
    it("should delegate to service with actor", () => {
      service.delete.mockReturnValue({ id: "t1" });

      const result = controller.delete("t1", request);

      expect(service.delete).toHaveBeenCalledWith("t1", actor);
      expect(result).toEqual({ id: "t1" });
    });
  });
});
