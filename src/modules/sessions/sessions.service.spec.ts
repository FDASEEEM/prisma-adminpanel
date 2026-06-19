import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { SessionsService } from "./sessions.service";

const mockPrismaService = () => ({
  adminSession: { findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn(), create: jest.fn(), updateMany: jest.fn() },
});

describe("SessionsService", () => {
  let service: SessionsService;
  let prisma: ReturnType<typeof mockPrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SessionsService, { provide: PrismaService, useFactory: mockPrismaService }],
    }).compile();

    service = module.get<SessionsService>(SessionsService);
    prisma = module.get(PrismaService) as any;
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("listActive", () => {
    it("should list active non-blocked sessions", () => {
      const expected = [{ id: "s1" }];
      prisma.adminSession.findMany.mockReturnValue(expected as any);

      const result = service.listActive();

      expect(prisma.adminSession.findMany).toHaveBeenCalledWith({ where: { isActive: true, isBlocked: false }, orderBy: { lastAccess: "desc" } });
      expect(result).toEqual(expected);
    });
  });

  describe("listHistorical", () => {
    it("should list inactive or blocked sessions", () => {
      const expected = [{ id: "s1" }];
      prisma.adminSession.findMany.mockReturnValue(expected as any);

      const result = service.listHistorical();

      expect(prisma.adminSession.findMany).toHaveBeenCalledWith({ where: { OR: [{ isActive: false }, { isBlocked: true }] }, orderBy: { createdAt: "desc" } });
      expect(result).toEqual(expected);
    });
  });

  describe("listBlocked", () => {
    it("should list blocked sessions", () => {
      const expected = [{ id: "s1" }];
      prisma.adminSession.findMany.mockReturnValue(expected as any);

      const result = service.listBlocked();

      expect(prisma.adminSession.findMany).toHaveBeenCalledWith({ where: { isBlocked: true }, orderBy: { lastAccess: "desc" } });
      expect(result).toEqual(expected);
    });
  });

  describe("listByUser", () => {
    it("should list sessions of a user", () => {
      const expected = [{ id: "s1" }];
      prisma.adminSession.findMany.mockReturnValue(expected as any);

      const result = service.listByUser("u1");

      expect(prisma.adminSession.findMany).toHaveBeenCalledWith({ where: { userId: "u1" }, orderBy: { lastAccess: "desc" } });
      expect(result).toEqual(expected);
    });
  });

  describe("block", () => {
    it("should block an existing session", async () => {
      prisma.adminSession.findUnique.mockResolvedValue({ id: "s1" } as any);
      const updated = { id: "s1", isBlocked: true, isActive: false };
      prisma.adminSession.update.mockResolvedValue(updated as any);

      const result = await service.block("s1");

      expect(prisma.adminSession.update).toHaveBeenCalledWith({ where: { id: "s1" }, data: { isBlocked: true, isActive: false } });
      expect(result).toEqual(updated);
    });

    it("should throw NotFoundException when session does not exist", async () => {
      prisma.adminSession.findUnique.mockResolvedValue(null);

      await expect(service.block("missing")).rejects.toThrow(NotFoundException);
    });
  });

  describe("unblock", () => {
    it("should unblock an existing session", async () => {
      prisma.adminSession.findUnique.mockResolvedValue({ id: "s1" } as any);
      const updated = { id: "s1", isBlocked: false, isActive: true };
      prisma.adminSession.update.mockResolvedValue(updated as any);

      const result = await service.unblock("s1");

      expect(prisma.adminSession.update).toHaveBeenCalledWith({ where: { id: "s1" }, data: { isBlocked: false, isActive: true } });
      expect(result).toEqual(updated);
    });

    it("should throw NotFoundException when session does not exist", async () => {
      prisma.adminSession.findUnique.mockResolvedValue(null);

      await expect(service.unblock("missing")).rejects.toThrow(NotFoundException);
    });
  });

  describe("terminate", () => {
    it("should terminate an existing session", async () => {
      prisma.adminSession.findUnique.mockResolvedValue({ id: "s1" } as any);
      const updated = { id: "s1", isActive: false };
      prisma.adminSession.update.mockResolvedValue(updated as any);

      const result = await service.terminate("s1");

      expect(prisma.adminSession.update).toHaveBeenCalledWith({ where: { id: "s1" }, data: { isActive: false } });
      expect(result).toEqual(updated);
    });

    it("should throw NotFoundException when session does not exist", async () => {
      prisma.adminSession.findUnique.mockResolvedValue(null);

      await expect(service.terminate("missing")).rejects.toThrow(NotFoundException);
    });
  });

  describe("create", () => {
    it("should create a session", () => {
      const dto = { userId: "u1", tokenHash: "hash", userAgent: "ua", ipAddress: "1.2.3.4", expiresAt: "2099-01-01T00:00:00.000Z" } as any;
      const created = { id: "s1" };
      prisma.adminSession.create.mockReturnValue(created as any);

      const result = service.create(dto);

      expect(prisma.adminSession.create).toHaveBeenCalledWith({
        data: { userId: "u1", tokenHash: "hash", userAgent: "ua", ipAddress: "1.2.3.4", expiresAt: new Date(dto.expiresAt) },
      });
      expect(result).toEqual(created);
    });
  });

  describe("recordAccess", () => {
    it("should update lastAccess of an existing session", async () => {
      prisma.adminSession.findUnique.mockResolvedValue({ id: "s1" } as any);
      const updated = { id: "s1" };
      prisma.adminSession.update.mockResolvedValue(updated as any);

      const result = await service.recordAccess("s1");

      expect(prisma.adminSession.update).toHaveBeenCalledWith({ where: { id: "s1" }, data: { lastAccess: expect.any(Date) } });
      expect(result).toEqual(updated);
    });

    it("should throw NotFoundException when session does not exist", async () => {
      prisma.adminSession.findUnique.mockResolvedValue(null);

      await expect(service.recordAccess("missing")).rejects.toThrow(NotFoundException);
    });
  });

  describe("cleanupExpired", () => {
    it("should deactivate expired sessions", async () => {
      const result = { count: 3 };
      prisma.adminSession.updateMany.mockResolvedValue(result as any);

      const response = await service.cleanupExpired();

      expect(prisma.adminSession.updateMany).toHaveBeenCalledWith({
        where: { expiresAt: { lt: expect.any(Date) }, isActive: true },
        data: { isActive: false },
      });
      expect(response).toEqual(result);
    });
  });
});
