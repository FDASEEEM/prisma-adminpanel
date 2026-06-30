import { Test, TestingModule } from "@nestjs/testing";
import { NotificationsController } from "./notifications.controller";
import { NotificationsService } from "./notifications.service";

const mockNotificationsService = () => ({
  listByUser: jest.fn(),
  listUnreadByUser: jest.fn(),
  markAsRead: jest.fn(),
});

describe("NotificationsController", () => {
  let controller: NotificationsController;
  let service: ReturnType<typeof mockNotificationsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [{ provide: NotificationsService, useFactory: mockNotificationsService }],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
    service = module.get(NotificationsService) as any;
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("list", () => {
    it("should delegate to service", () => {
      const expected = [{ id: "n1" }];
      service.listByUser.mockReturnValue(expected);

      const result = controller.list("u1");

      expect(service.listByUser).toHaveBeenCalledWith("u1");
      expect(result).toEqual(expected);
    });
  });

  describe("unread", () => {
    it("should delegate to service", () => {
      const expected = [{ id: "n1" }];
      service.listUnreadByUser.mockReturnValue(expected);

      const result = controller.unread("u1");

      expect(service.listUnreadByUser).toHaveBeenCalledWith("u1");
      expect(result).toEqual(expected);
    });
  });

  describe("markAsRead", () => {
    it("should delegate to service", () => {
      const expected = { id: "n1", read: true };
      service.markAsRead.mockReturnValue(expected);

      const result = controller.markAsRead("n1");

      expect(service.markAsRead).toHaveBeenCalledWith("n1");
      expect(result).toEqual(expected);
    });
  });
});
