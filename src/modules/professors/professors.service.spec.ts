import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { AdminAuditAction } from "@prisma/client";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { UsersApiClient } from "../../infrastructure/users-api/users-api.client";
import { ProfessorsService } from "./professors.service";

const mockPrismaService = () => ({
  professor: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
});

const mockAuditLogsService = () => ({ create: jest.fn() });
const mockUsersApiClient = () => ({ createProfessorUser: jest.fn() });

describe("ProfessorsService", () => {
  let service: ProfessorsService;
  let prisma: ReturnType<typeof mockPrismaService>;
  let auditLogs: ReturnType<typeof mockAuditLogsService>;
  let usersApiClient: ReturnType<typeof mockUsersApiClient>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfessorsService,
        { provide: PrismaService, useFactory: mockPrismaService },
        { provide: AuditLogsService, useFactory: mockAuditLogsService },
        { provide: UsersApiClient, useFactory: mockUsersApiClient },
      ],
    }).compile();

    service = module.get<ProfessorsService>(ProfessorsService);
    prisma = module.get(PrismaService) as any;
    auditLogs = module.get(AuditLogsService) as any;
    usersApiClient = module.get(UsersApiClient) as any;
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("list", () => {
    it("should apply default pagination with no filters", () => {
      prisma.professor.findMany.mockReturnValue([] as any);

      service.list();

      expect(prisma.professor.findMany).toHaveBeenCalledWith({ where: {}, orderBy: { createdAt: "desc" }, skip: 0, take: 50 });
    });

    it("should apply colegioId, isActive and especialidad filters with custom pagination", () => {
      prisma.professor.findMany.mockReturnValue([] as any);

      service.list({ page: 2, limit: 5, isActive: true, especialidad: "Math" } as any, "c1");

      expect(prisma.professor.findMany).toHaveBeenCalledWith({
        where: { colegioId: "c1", isActive: true, especialidad: { contains: "Math", mode: "insensitive" } },
        orderBy: { createdAt: "desc" },
        skip: 5,
        take: 5,
      });
    });
  });

  describe("get", () => {
    it("should return professor when found", async () => {
      const expected = { id: "p1" };
      prisma.professor.findUnique.mockResolvedValue(expected as any);

      const result = await service.get("p1");

      expect(prisma.professor.findUnique).toHaveBeenCalledWith({ where: { id: "p1" } });
      expect(result).toEqual(expected);
    });

    it("should throw NotFoundException when not found", async () => {
      prisma.professor.findUnique.mockResolvedValue(null);

      await expect(service.get("missing")).rejects.toThrow(NotFoundException);
    });
  });

  describe("getByUserId", () => {
    it("should return professor when found", async () => {
      const expected = { id: "p1", userId: "u1" };
      prisma.professor.findUnique.mockResolvedValue(expected as any);

      const result = await service.getByUserId("u1");

      expect(prisma.professor.findUnique).toHaveBeenCalledWith({ where: { userId: "u1" } });
      expect(result).toEqual(expected);
    });

    it("should throw NotFoundException when not found", async () => {
      prisma.professor.findUnique.mockResolvedValue(null);

      await expect(service.getByUserId("missing")).rejects.toThrow(NotFoundException);
    });
  });

  describe("create", () => {
    it("should use provided userId without calling usersApiClient", async () => {
      const dto = { userId: "u1", nombreCompleto: "Prof", email: "p@p.com" } as any;
      const created = { id: "p1", email: "p@p.com", nombreCompleto: "Prof" };
      prisma.professor.create.mockResolvedValue(created as any);

      const result = await service.create(dto);

      expect(usersApiClient.createProfessorUser).not.toHaveBeenCalled();
      expect(prisma.professor.create).toHaveBeenCalledWith({
        data: { userId: "u1", nombreCompleto: "Prof", email: "p@p.com", especialidad: undefined, telefono: undefined, colegioId: undefined, isActive: true },
      });
      expect(result).toEqual(created);
    });

    it("should create user via usersApiClient when no userId provided", async () => {
      const dto = { email: "p@p.com", nombreCompleto: "Prof", password: "pass", colegioId: "c1" } as any;
      usersApiClient.createProfessorUser.mockResolvedValue({ id: "new-u1", email: "p@p.com" });
      const created = { id: "p1", email: "p@p.com", nombreCompleto: "Prof" };
      prisma.professor.create.mockResolvedValue(created as any);
      const actor = { id: "admin1" };

      const result = await service.create(dto, actor, "token123");

      expect(usersApiClient.createProfessorUser).toHaveBeenCalledWith(
        { email: "p@p.com", nombreCompleto: "Prof", password: "pass", role: "TEACHER", colegioId: "c1" },
        "token123",
      );
      expect(prisma.professor.create).toHaveBeenCalledWith({
        data: { userId: "new-u1", nombreCompleto: "Prof", email: "p@p.com", especialidad: undefined, telefono: undefined, colegioId: "c1", isActive: true },
      });
      expect(auditLogs.create).toHaveBeenCalledWith(actor, AdminAuditAction.teacher_create, "Professor", "p1", { email: "p@p.com", nombreCompleto: "Prof" });
      expect(result).toEqual(created);
    });

    it("should throw NotFoundException if userId cannot be resolved", async () => {
      const dto = {} as any;

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe("update", () => {
    it("should update professor and log audit", async () => {
      prisma.professor.findUnique.mockResolvedValue({ id: "p1" } as any);
      const updated = { id: "p1", email: "new@p.com" };
      prisma.professor.update.mockResolvedValue(updated as any);
      const actor = { id: "u1" };

      const result = await service.update("p1", { email: "new@p.com" } as any, actor);

      expect(prisma.professor.update).toHaveBeenCalled();
      expect(auditLogs.create).toHaveBeenCalledWith(actor, AdminAuditAction.teacher_update, "Professor", "p1", { email: "new@p.com" });
      expect(result).toEqual(updated);
    });

    it("should throw NotFoundException if professor does not exist", async () => {
      prisma.professor.findUnique.mockResolvedValue(null);

      await expect(service.update("missing", {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe("delete", () => {
    it("should delete professor and log audit", async () => {
      const existing = { id: "p1", email: "p@p.com" };
      prisma.professor.findUnique.mockResolvedValue(existing as any);
      prisma.professor.delete.mockResolvedValue(existing as any);
      const actor = { id: "u1" };

      const result = await service.delete("p1", actor);

      expect(prisma.professor.delete).toHaveBeenCalledWith({ where: { id: "p1" } });
      expect(auditLogs.create).toHaveBeenCalledWith(actor, AdminAuditAction.teacher_delete, "Professor", "p1", { email: "p@p.com" });
      expect(result).toEqual(existing);
    });

    it("should throw NotFoundException if professor does not exist", async () => {
      prisma.professor.findUnique.mockResolvedValue(null);

      await expect(service.delete("missing")).rejects.toThrow(NotFoundException);
    });
  });
});
