import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { AdminAuditAction } from "@prisma/client";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { AnnouncementsService } from "./announcements.service";

const mockPrismaService = () => ({
  announcement: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
});

const mockAuditLogsService = () => ({ create: jest.fn() });

describe("AnnouncementsService", () => {
  let service: AnnouncementsService;
  let prisma: ReturnType<typeof mockPrismaService>;
  let auditLogs: ReturnType<typeof mockAuditLogsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnnouncementsService,
        { provide: PrismaService, useFactory: mockPrismaService },
        { provide: AuditLogsService, useFactory: mockAuditLogsService },
      ],
    }).compile();

    service = module.get<AnnouncementsService>(AnnouncementsService);
    prisma = module.get(PrismaService) as any;
    auditLogs = module.get(AuditLogsService) as any;
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("listActive", () => {
    it("should list active announcements", () => {
      const expected = [{ id: "a1", isActive: true }];
      prisma.announcement.findMany.mockReturnValue(expected as any);

      const result = service.listActive();

      expect(prisma.announcement.findMany).toHaveBeenCalledWith({ where: { isActive: true }, orderBy: { createdAt: "desc" } });
      expect(result).toEqual(expected);
    });
  });

  describe("list", () => {
    it("should apply pagination and filters defaults", () => {
      prisma.announcement.findMany.mockReturnValue([] as any);

      service.list();

      expect(prisma.announcement.findMany).toHaveBeenCalledWith({ where: {}, orderBy: { createdAt: "desc" }, skip: 0, take: 50 });
    });

    it("should apply custom query filters", () => {
      prisma.announcement.findMany.mockReturnValue([] as any);

      service.list({ page: 2, limit: 10, isActive: true, audience: "ALL" } as any);

      expect(prisma.announcement.findMany).toHaveBeenCalledWith({
        where: { isActive: true, audience: "ALL" },
        orderBy: { createdAt: "desc" },
        skip: 10,
        take: 10,
      });
    });
  });

  describe("get", () => {
    it("should return announcement when found", async () => {
      const expected = { id: "a1" };
      prisma.announcement.findUnique.mockResolvedValue(expected as any);

      const result = await service.get("a1");

      expect(prisma.announcement.findUnique).toHaveBeenCalledWith({ where: { id: "a1" } });
      expect(result).toEqual(expected);
    });

    it("should throw NotFoundException when not found", async () => {
      prisma.announcement.findUnique.mockResolvedValue(null);

      await expect(service.get("missing")).rejects.toThrow(NotFoundException);
    });
  });

  describe("create", () => {
    it("should create announcement and log audit when actor present", async () => {
      const dto = { title: "T", body: "B", startsAt: "2024-01-01T00:00:00.000Z" } as any;
      const created = { id: "a1", title: "T" };
      prisma.announcement.create.mockResolvedValue(created as any);
      const actor = { id: "u1" };

      const result = await service.create(dto, actor);

      expect(prisma.announcement.create).toHaveBeenCalled();
      expect(auditLogs.create).toHaveBeenCalledWith(actor, AdminAuditAction.announcement_create, "Announcement", "a1", { title: "T" });
      expect(result).toEqual(created);
    });

    it("should not log audit when no actor", async () => {
      const dto = { title: "T", body: "B" } as any;
      prisma.announcement.create.mockResolvedValue({ id: "a1", title: "T" } as any);

      await service.create(dto);

      expect(auditLogs.create).not.toHaveBeenCalled();
    });
  });

  describe("update", () => {
    it("should update announcement and log audit", async () => {
      prisma.announcement.findUnique.mockResolvedValue({ id: "a1" } as any);
      const updated = { id: "a1", title: "New" };
      prisma.announcement.update.mockResolvedValue(updated as any);
      const actor = { id: "u1" };

      const result = await service.update("a1", { title: "New" } as any, actor);

      expect(prisma.announcement.update).toHaveBeenCalled();
      expect(auditLogs.create).toHaveBeenCalledWith(actor, AdminAuditAction.announcement_update, "Announcement", "a1", { title: "New" });
      expect(result).toEqual(updated);
    });

    it("should throw NotFoundException if announcement does not exist", async () => {
      prisma.announcement.findUnique.mockResolvedValue(null);

      await expect(service.update("missing", {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe("delete", () => {
    it("should delete announcement and log audit", async () => {
      const existing = { id: "a1", title: "T" };
      prisma.announcement.findUnique.mockResolvedValue(existing as any);
      prisma.announcement.delete.mockResolvedValue(existing as any);
      const actor = { id: "u1" };

      const result = await service.delete("a1", actor);

      expect(prisma.announcement.delete).toHaveBeenCalledWith({ where: { id: "a1" } });
      expect(auditLogs.create).toHaveBeenCalledWith(actor, AdminAuditAction.announcement_delete, "Announcement", "a1", { title: "T" });
      expect(result).toEqual(existing);
    });

    it("should throw NotFoundException if announcement does not exist", async () => {
      prisma.announcement.findUnique.mockResolvedValue(null);

      await expect(service.delete("missing")).rejects.toThrow(NotFoundException);
    });
  });
});
