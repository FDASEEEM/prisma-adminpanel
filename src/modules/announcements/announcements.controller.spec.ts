import { Test, TestingModule } from "@nestjs/testing";
import { AnnouncementsController } from "./announcements.controller";
import { AnnouncementsService } from "./announcements.service";
import { AdminAuthGuard } from "../../auth/guards/admin-auth.guard";

const mockAnnouncementsService = () => ({
  list: jest.fn(),
  listActive: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

describe("AnnouncementsController", () => {
  let controller: AnnouncementsController;
  let service: ReturnType<typeof mockAnnouncementsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnnouncementsController],
      providers: [{ provide: AnnouncementsService, useFactory: mockAnnouncementsService }],
    })
      .overrideGuard(AdminAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AnnouncementsController>(AnnouncementsController);
    service = module.get(AnnouncementsService) as any;
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  const request: any = { adminUser: { id: "u1", email: "u@u.com", nombreCompleto: "User" } };
  const actor = { id: "u1", email: "u@u.com", name: "User" };

  describe("list", () => {
    it("should delegate to service", () => {
      const expected = [{ id: "a1" }];
      service.list.mockReturnValue(expected);

      const result = controller.list({ page: 1 } as any);

      expect(service.list).toHaveBeenCalledWith({ page: 1 });
      expect(result).toEqual(expected);
    });
  });

  describe("listActive", () => {
    it("should delegate to service", () => {
      const expected = [{ id: "a1" }];
      service.listActive.mockReturnValue(expected);

      const result = controller.listActive();

      expect(service.listActive).toHaveBeenCalled();
      expect(result).toEqual(expected);
    });
  });

  describe("create", () => {
    it("should delegate to service with actor", () => {
      const dto = { title: "T" } as any;
      const expected = { id: "a1" };
      service.create.mockReturnValue(expected);

      const result = controller.create(dto, request);

      expect(service.create).toHaveBeenCalledWith(dto, actor);
      expect(result).toEqual(expected);
    });

    it("should delegate to service without actor when no adminUser", () => {
      const dto = { title: "T" } as any;
      service.create.mockReturnValue({ id: "a1" });

      controller.create(dto, {} as any);

      expect(service.create).toHaveBeenCalledWith(dto, undefined);
    });
  });

  describe("update", () => {
    it("should delegate to service with actor", () => {
      const dto = { title: "New" } as any;
      const expected = { id: "a1" };
      service.update.mockReturnValue(expected);

      const result = controller.update("a1", dto, request);

      expect(service.update).toHaveBeenCalledWith("a1", dto, actor);
      expect(result).toEqual(expected);
    });
  });

  describe("delete", () => {
    it("should delegate to service with actor", () => {
      const expected = { id: "a1" };
      service.delete.mockReturnValue(expected);

      const result = controller.delete("a1", request);

      expect(service.delete).toHaveBeenCalledWith("a1", actor);
      expect(result).toEqual(expected);
    });
  });
});
