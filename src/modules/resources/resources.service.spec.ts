import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { AdminAuditAction } from "@prisma/client";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { ResourcesService } from "./resources.service";

const mockPrismaService = () => ({
  resourceMaterial: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
});

const mockAuditLogsService = () => ({ create: jest.fn() });

describe("ResourcesService", () => {
  let service: ResourcesService;
  let prisma: ReturnType<typeof mockPrismaService>;
  let auditLogs: ReturnType<typeof mockAuditLogsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResourcesService,
        { provide: PrismaService, useFactory: mockPrismaService },
        { provide: AuditLogsService, useFactory: mockAuditLogsService },
      ],
    }).compile();

    service = module.get<ResourcesService>(ResourcesService);
    prisma = module.get(PrismaService) as any;
    auditLogs = module.get(AuditLogsService) as any;
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("list", () => {
    it("should apply default pagination", () => {
      prisma.resourceMaterial.findMany.mockReturnValue([] as any);

      service.list();

      expect(prisma.resourceMaterial.findMany).toHaveBeenCalledWith({ where: {}, orderBy: { createdAt: "desc" }, skip: 0, take: 50 });
    });

    it("should apply type filter and custom pagination", () => {
      prisma.resourceMaterial.findMany.mockReturnValue([] as any);

      service.list({ page: 2, limit: 5, type: "PDF" } as any);

      expect(prisma.resourceMaterial.findMany).toHaveBeenCalledWith({ where: { type: "PDF" }, orderBy: { createdAt: "desc" }, skip: 5, take: 5 });
    });
  });

  describe("get", () => {
    it("should return resource when found", async () => {
      const expected = { id: "r1" };
      prisma.resourceMaterial.findUnique.mockResolvedValue(expected as any);

      const result = await service.get("r1");

      expect(prisma.resourceMaterial.findUnique).toHaveBeenCalledWith({ where: { id: "r1" } });
      expect(result).toEqual(expected);
    });

    it("should throw NotFoundException when not found", async () => {
      prisma.resourceMaterial.findUnique.mockResolvedValue(null);

      await expect(service.get("missing")).rejects.toThrow(NotFoundException);
    });
  });

  describe("create", () => {
    it("should create resource and log audit", async () => {
      const dto = { title: "T" } as any;
      const created = { id: "r1", title: "T" };
      prisma.resourceMaterial.create.mockResolvedValue(created as any);
      const actor = { id: "u1" };

      const result = await service.create(dto, actor);

      expect(prisma.resourceMaterial.create).toHaveBeenCalledWith({ data: dto });
      expect(auditLogs.create).toHaveBeenCalledWith(actor, AdminAuditAction.resource_create, "ResourceMaterial", "r1", { title: "T" });
      expect(result).toEqual(created);
    });

    it("should not log audit when no actor", async () => {
      prisma.resourceMaterial.create.mockResolvedValue({ id: "r1", title: "T" } as any);

      await service.create({ title: "T" } as any);

      expect(auditLogs.create).not.toHaveBeenCalled();
    });
  });

  describe("update", () => {
    it("should update resource and log audit", async () => {
      prisma.resourceMaterial.findUnique.mockResolvedValue({ id: "r1" } as any);
      const updated = { id: "r1", title: "New" };
      prisma.resourceMaterial.update.mockResolvedValue(updated as any);
      const actor = { id: "u1" };

      const result = await service.update("r1", { title: "New" } as any, actor);

      expect(prisma.resourceMaterial.update).toHaveBeenCalled();
      expect(auditLogs.create).toHaveBeenCalledWith(actor, AdminAuditAction.resource_update, "ResourceMaterial", "r1", { title: "New" });
      expect(result).toEqual(updated);
    });

    it("should throw NotFoundException if resource does not exist", async () => {
      prisma.resourceMaterial.findUnique.mockResolvedValue(null);

      await expect(service.update("missing", {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe("delete", () => {
    it("should delete resource and log audit", async () => {
      const existing = { id: "r1", title: "T" };
      prisma.resourceMaterial.findUnique.mockResolvedValue(existing as any);
      prisma.resourceMaterial.delete.mockResolvedValue(existing as any);
      const actor = { id: "u1" };

      const result = await service.delete("r1", actor);

      expect(prisma.resourceMaterial.delete).toHaveBeenCalledWith({ where: { id: "r1" } });
      expect(auditLogs.create).toHaveBeenCalledWith(actor, AdminAuditAction.resource_delete, "ResourceMaterial", "r1", { title: "T" });
      expect(result).toEqual(existing);
    });

    it("should throw NotFoundException if resource does not exist", async () => {
      prisma.resourceMaterial.findUnique.mockResolvedValue(null);

      await expect(service.delete("missing")).rejects.toThrow(NotFoundException);
    });
  });
});
