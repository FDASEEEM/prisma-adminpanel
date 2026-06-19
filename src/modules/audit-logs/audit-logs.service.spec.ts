import { Test, TestingModule } from "@nestjs/testing";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { AuditLogsService } from "./audit-logs.service";

const mockPrismaService = () => ({
  adminAuditLog: { findMany: jest.fn(), create: jest.fn() },
});

describe("AuditLogsService", () => {
  let service: AuditLogsService;
  let prisma: ReturnType<typeof mockPrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuditLogsService, { provide: PrismaService, useFactory: mockPrismaService }],
    }).compile();

    service = module.get<AuditLogsService>(AuditLogsService);
    prisma = module.get(PrismaService) as any;
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("list", () => {
    it("should list audit logs ordered by createdAt desc", () => {
      const expected = [{ id: "l1" }];
      prisma.adminAuditLog.findMany.mockReturnValue(expected as any);

      const result = service.list();

      expect(prisma.adminAuditLog.findMany).toHaveBeenCalledWith({ orderBy: { createdAt: "desc" } });
      expect(result).toEqual(expected);
    });
  });

  describe("create", () => {
    it("should create log with string actor and no metadata", () => {
      const created = { id: "l1" };
      prisma.adminAuditLog.create.mockReturnValue(created as any);

      const result = service.create("actor1", "login" as any, "auth");

      expect(prisma.adminAuditLog.create).toHaveBeenCalledWith({
        data: { actorId: "actor1", action: "login", entity: "auth", entityId: undefined, metadata: Prisma.JsonNull },
      });
      expect(result).toEqual(created);
    });

    it("should create log with ActorInfo and enrich metadata", () => {
      const created = { id: "l1" };
      prisma.adminAuditLog.create.mockReturnValue(created as any);
      const actor = { id: "actor1", name: "Actor Name", email: "actor@a.com" };

      service.create(actor, "ticket_create" as any, "SupportTicket", "t1", { subject: "S" });

      expect(prisma.adminAuditLog.create).toHaveBeenCalledWith({
        data: {
          actorId: "actor1",
          action: "ticket_create",
          entity: "SupportTicket",
          entityId: "t1",
          metadata: { subject: "S", actorName: "Actor Name", actorEmail: "actor@a.com" },
        },
      });
    });
  });
});
