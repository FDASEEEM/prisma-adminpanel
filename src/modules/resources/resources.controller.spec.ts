import { Test, TestingModule } from "@nestjs/testing";
import { ResourcesController } from "./resources.controller";
import { ResourcesService } from "./resources.service";
import { AdminAuthGuard } from "../../auth/guards/admin-auth.guard";

const mockResourcesService = () => ({
  list: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

describe("ResourcesController", () => {
  let controller: ResourcesController;
  let service: ReturnType<typeof mockResourcesService>;
  const request: any = { adminUser: { id: "u1", email: "u@u.com", nombreCompleto: "User" } };
  const actor = { id: "u1", email: "u@u.com", name: "User" };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ResourcesController],
      providers: [{ provide: ResourcesService, useFactory: mockResourcesService }],
    })
      .overrideGuard(AdminAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ResourcesController>(ResourcesController);
    service = module.get(ResourcesService) as any;
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("list", () => {
    it("should delegate to service", () => {
      const expected = [{ id: "r1" }];
      service.list.mockReturnValue(expected);

      const result = controller.list({ page: 1 } as any);

      expect(service.list).toHaveBeenCalledWith({ page: 1 });
      expect(result).toEqual(expected);
    });
  });

  describe("create", () => {
    it("should delegate to service with actor", () => {
      const dto = { title: "T" } as any;
      const expected = { id: "r1" };
      service.create.mockReturnValue(expected);

      const result = controller.create(dto, request);

      expect(service.create).toHaveBeenCalledWith(dto, actor);
      expect(result).toEqual(expected);
    });
  });

  describe("update", () => {
    it("should delegate to service with actor", () => {
      const dto = { title: "New" } as any;
      const expected = { id: "r1" };
      service.update.mockReturnValue(expected);

      const result = controller.update("r1", dto, request);

      expect(service.update).toHaveBeenCalledWith("r1", dto, actor);
      expect(result).toEqual(expected);
    });
  });

  describe("delete", () => {
    it("should delegate to service with actor", () => {
      const expected = { id: "r1" };
      service.delete.mockReturnValue(expected);

      const result = controller.delete("r1", request);

      expect(service.delete).toHaveBeenCalledWith("r1", actor);
      expect(result).toEqual(expected);
    });
  });
});
