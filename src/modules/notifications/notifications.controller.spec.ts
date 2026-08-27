import { Test, TestingModule } from "@nestjs/testing";
import { NotificationsController } from "./notifications.controller";
import { NotificationsService } from "./notifications.service";
import { UserAuthGuard } from "../../auth/guards/user-auth.guard";

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
    })
      .overrideGuard(UserAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<NotificationsController>(NotificationsController);
    service = module.get(NotificationsService) as any;
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("list", () => {
    it("should delegate to service with the authenticated user id", () => {
      const expected = [{ id: "n1" }];
      service.listByUser.mockReturnValue(expected);
      const request = { user: { id: "u1" } };

      const result = controller.list(request as any);

      expect(service.listByUser).toHaveBeenCalledWith("u1");
      expect(result).toEqual(expected);
    });
  });

  describe("unread", () => {
    it("should delegate to service with the authenticated user id", () => {
      const expected = [{ id: "n1" }];
      service.listUnreadByUser.mockReturnValue(expected);
      const request = { user: { id: "u1" } };

      const result = controller.unread(request as any);

      expect(service.listUnreadByUser).toHaveBeenCalledWith("u1");
      expect(result).toEqual(expected);
    });
  });

  describe("markAsRead", () => {
    it("should delegate to service with the notification id and authenticated user id", () => {
      const expected = { id: "n1", read: true };
      service.markAsRead.mockReturnValue(expected);
      const request = { user: { id: "u1" } };

      const result = controller.markAsRead("n1", request as any);

      expect(service.markAsRead).toHaveBeenCalledWith("n1", "u1");
      expect(result).toEqual(expected);
    });
  });
});
