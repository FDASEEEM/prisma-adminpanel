import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { NotificationsService } from "./notifications.service";

const mockPrismaService = () => ({
  notification: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
});

describe("NotificationsService", () => {
  let service: NotificationsService;
  let prisma: ReturnType<typeof mockPrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useFactory: mockPrismaService },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    prisma = module.get(PrismaService) as any;
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("listByUser", () => {
    it("should return notifications ordered by createdAt desc", async () => {
      const expected = [{ id: "n1", userId: "u1", title: "T", message: "M", read: false, createdAt: new Date() }];
      prisma.notification.findMany.mockResolvedValue(expected);

      const result = await service.listByUser("u1");

      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: "u1" },
        orderBy: { createdAt: "desc" },
      });
      expect(result).toEqual(expected);
    });
  });

  describe("listUnreadByUser", () => {
    it("should return only unread notifications", async () => {
      const expected = [{ id: "n1", userId: "u1", title: "T", message: "M", read: false, createdAt: new Date() }];
      prisma.notification.findMany.mockResolvedValue(expected);

      const result = await service.listUnreadByUser("u1");

      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: "u1", read: false },
        orderBy: { createdAt: "desc" },
      });
      expect(result).toEqual(expected);
    });
  });

  describe("create", () => {
    it("should create a notification", async () => {
      const payload = { id: "n1", userId: "u1", title: "T", message: "M", ticketId: "t1", read: false, createdAt: new Date() };
      prisma.notification.create.mockResolvedValue(payload);

      const result = await service.create("u1", "T", "M", "t1");

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: { userId: "u1", title: "T", message: "M", ticketId: "t1" },
      });
      expect(result).toEqual(payload);
    });
  });

  describe("markAsRead", () => {
    it("should update read to true", async () => {
      const updated = { id: "n1", userId: "u1", title: "T", message: "M", read: true, createdAt: new Date() };
      prisma.notification.update.mockResolvedValue(updated);

      const result = await service.markAsRead("n1");

      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: "n1" },
        data: { read: true },
      });
      expect(result).toEqual(updated);
    });
  });
});
