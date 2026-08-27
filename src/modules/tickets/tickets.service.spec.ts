import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { AdminAuditAction } from "@prisma/client";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { NotificationsService } from "../notifications/notifications.service";
import { TicketsService } from "./tickets.service";

const mockPrismaService = () => ({
  supportTicket: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  supportTicketReply: { create: jest.fn() },
});

const mockAuditLogsService = () => ({ create: jest.fn() });
const mockNotificationsService = () => ({ create: jest.fn() });

describe("TicketsService", () => {
  let service: TicketsService;
  let prisma: ReturnType<typeof mockPrismaService>;
  let auditLogs: ReturnType<typeof mockAuditLogsService>;
  let notifications: ReturnType<typeof mockNotificationsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        { provide: PrismaService, useFactory: mockPrismaService },
        { provide: AuditLogsService, useFactory: mockAuditLogsService },
        { provide: NotificationsService, useFactory: mockNotificationsService },
      ],
    }).compile();

    service = module.get<TicketsService>(TicketsService);
    prisma = module.get(PrismaService) as any;
    auditLogs = module.get(AuditLogsService) as any;
    notifications = module.get(NotificationsService) as any;
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("list", () => {
    it("should apply default pagination", () => {
      prisma.supportTicket.findMany.mockReturnValue([] as any);

      service.list();

      expect(prisma.supportTicket.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
        skip: 0,
        take: 50,
      });
    });

    it("should apply status/requesterId filters and custom pagination", () => {
      prisma.supportTicket.findMany.mockReturnValue([] as any);

      service.list({ page: 2, limit: 10, status: "open", requesterId: "r1" } as any);

      expect(prisma.supportTicket.findMany).toHaveBeenCalledWith({
        where: { status: "open", requesterId: "r1" },
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
        skip: 10,
        take: 10,
      });
    });
  });

  describe("listByRequester", () => {
    it("should list tickets with replies for a requester", () => {
      const expected = [{ id: "t1", replies: [] }];
      prisma.supportTicket.findMany.mockReturnValue(expected as any);

      const result = service.listByRequester("r1");

      expect(prisma.supportTicket.findMany).toHaveBeenCalledWith({
        where: { requesterId: "r1" },
        orderBy: { createdAt: "desc" },
        include: { replies: { orderBy: { createdAt: "asc" } } },
      });
      expect(result).toEqual(expected);
    });
  });

  describe("get", () => {
    it("should return ticket with replies when found", async () => {
      const expected = { id: "t1", replies: [] };
      prisma.supportTicket.findUnique.mockResolvedValue(expected as any);

      const result = await service.get("t1");

      expect(prisma.supportTicket.findUnique).toHaveBeenCalledWith({
        where: { id: "t1" },
        include: { replies: { orderBy: { createdAt: "asc" } } },
      });
      expect(result).toEqual(expected);
    });

    it("should throw NotFoundException when not found", async () => {
      prisma.supportTicket.findUnique.mockResolvedValue(null);

      await expect(service.get("missing")).rejects.toThrow(NotFoundException);
    });
  });

  describe("create", () => {
    it("should create ticket and log audit when actor present", async () => {
      const dto = { subject: "S", requesterId: "r1" } as any;
      const created = { id: "t1", subject: "S" };
      prisma.supportTicket.create.mockResolvedValue(created as any);
      const actor = { id: "u1" };

      const result = await service.create(dto, actor);

      expect(prisma.supportTicket.create).toHaveBeenCalledWith({
        data: { subject: "S", requesterId: "r1" },
      });
      expect(auditLogs.create).toHaveBeenCalledWith(actor, AdminAuditAction.ticket_create, "SupportTicket", "t1", { subject: "S" });
      expect(result).toEqual(created);
    });

    it("should not log audit when no actor", async () => {
      prisma.supportTicket.create.mockResolvedValue({ id: "t1", subject: "S" } as any);

      await service.create({ subject: "S", requesterId: "r1" } as any);

      expect(auditLogs.create).not.toHaveBeenCalled();
    });

    it("should reject when requesterId is missing", async () => {
      await expect(service.create({ subject: "S" } as any)).rejects.toThrow(
        "requesterId is required.",
      );
    });
  });

  describe("update", () => {
    it("should update ticket without message or status change", async () => {
      prisma.supportTicket.findUnique.mockResolvedValue({ id: "t1", status: "open", subject: "S", requesterId: "r1" } as any);
      const updated = { id: "t1", subject: "S", status: "open" };
      prisma.supportTicket.update.mockResolvedValue(updated as any);

      const result = await service.update("t1", { assignedTo: "a1" } as any);

      expect(prisma.supportTicket.update).toHaveBeenCalled();
      expect(prisma.supportTicketReply.create).not.toHaveBeenCalled();
      expect(notifications.create).not.toHaveBeenCalled();
      expect(result).toEqual(updated);
    });

    it("should create a reply and log audit when message present", async () => {
      prisma.supportTicket.findUnique.mockResolvedValue({ id: "t1", status: "open", subject: "S", requesterId: "r1" } as any);
      const updated = { id: "t1", subject: "S", status: "open" };
      prisma.supportTicket.update.mockResolvedValue(updated as any);
      const actor = { id: "u1" };

      await service.update("t1", { message: "Hello" } as any, actor);

      expect(prisma.supportTicketReply.create).toHaveBeenCalledWith({
        data: { ticketId: "t1", authorId: "u1", message: "Hello" },
      });
      expect(auditLogs.create).toHaveBeenCalledWith(actor, AdminAuditAction.ticket_reply, "SupportTicketReply", "t1", { ticketId: "t1" });
    });

    it("should use assignedTo as reply author when no actor", async () => {
      prisma.supportTicket.findUnique.mockResolvedValue({ id: "t1", status: "open", subject: "S", requesterId: "r1" } as any);
      prisma.supportTicket.update.mockResolvedValue({ id: "t1", subject: "S", status: "open" } as any);

      await service.update("t1", { message: "Hello", assignedTo: "a1" } as any);

      expect(prisma.supportTicketReply.create).toHaveBeenCalledWith({
        data: { ticketId: "t1", authorId: "a1", message: "Hello" },
      });
    });

    it("should log status_change audit and notify when status becomes closed", async () => {
      prisma.supportTicket.findUnique.mockResolvedValue({ id: "t1", status: "open", subject: "S", requesterId: "r1" } as any);
      const updated = { id: "t1", subject: "S", status: "closed" };
      prisma.supportTicket.update.mockResolvedValue(updated as any);
      const actor = { id: "u1" };

      const result = await service.update("t1", { status: "closed" } as any, actor);

      expect(prisma.supportTicket.update).toHaveBeenCalledWith({
        where: { id: "t1" },
        data: { assignedTo: undefined, status: "closed", priority: undefined, closedAt: expect.any(Date) },
      });
      expect(auditLogs.create).toHaveBeenCalledWith(actor, AdminAuditAction.ticket_status_change, "SupportTicket", "t1", { status: "closed" });
      expect(notifications.create).toHaveBeenCalledWith("r1", "Ticket cerrado: S", 'Tu ticket "S" ha sido cerrado por el equipo de soporte.', "t1");
      expect(result).toEqual(updated);
    });

    it("should log priority change audit", async () => {
      prisma.supportTicket.findUnique.mockResolvedValue({ id: "t1", status: "open", subject: "S", requesterId: "r1" } as any);
      prisma.supportTicket.update.mockResolvedValue({ id: "t1", subject: "S", status: "open" } as any);
      const actor = { id: "u1" };

      await service.update("t1", { priority: "high" } as any, actor);

      expect(auditLogs.create).toHaveBeenCalledWith(actor, AdminAuditAction.ticket_status_change, "SupportTicket", "t1", { priority: "high" });
    });

    it("should not notify when ticket was already closed", async () => {
      prisma.supportTicket.findUnique.mockResolvedValue({ id: "t1", status: "closed", subject: "S", requesterId: "r1" } as any);
      prisma.supportTicket.update.mockResolvedValue({ id: "t1", subject: "S", status: "closed" } as any);

      await service.update("t1", { status: "closed" } as any);

      expect(notifications.create).not.toHaveBeenCalled();
    });

    it("should throw NotFoundException if ticket does not exist", async () => {
      prisma.supportTicket.findUnique.mockResolvedValue(null);

      await expect(service.update("missing", {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe("delete", () => {
    it("should delete ticket and log audit", async () => {
      const existing = { id: "t1", subject: "S", replies: [] };
      prisma.supportTicket.findUnique.mockResolvedValue(existing as any);
      prisma.supportTicket.delete.mockResolvedValue(existing as any);
      const actor = { id: "u1" };

      const result = await service.delete("t1", actor);

      expect(prisma.supportTicket.delete).toHaveBeenCalledWith({ where: { id: "t1" } });
      expect(auditLogs.create).toHaveBeenCalledWith(actor, AdminAuditAction.ticket_delete, "SupportTicket", "t1", { subject: "S" });
      expect(result).toEqual(existing);
    });

    it("should throw NotFoundException if ticket does not exist", async () => {
      prisma.supportTicket.findUnique.mockResolvedValue(null);

      await expect(service.delete("missing")).rejects.toThrow(NotFoundException);
    });
  });
});
