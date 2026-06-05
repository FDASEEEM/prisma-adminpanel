import { Injectable, NotFoundException } from "@nestjs/common";
import { AdminAuditAction, Prisma, TicketStatus, TicketPriority } from "@prisma/client";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { AuditLogsService, ActorInfo } from "../audit-logs/audit-logs.service";
import { NotificationsService } from "../notifications/notifications.service";
import { CreateTicketDto } from "./dto/create-ticket.dto";
import { UpdateTicketDto } from "./dto/update-ticket.dto";
import { PaginationDto } from "./dto/pagination.dto";

@Injectable()
export class TicketsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogs: AuditLogsService,
    private readonly notifications: NotificationsService,
  ) {}

  list(query?: PaginationDto) {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 50;
    const skip = (page - 1) * limit;
    const where: Prisma.SupportTicketWhereInput = {};
    if (query?.status) where.status = query.status as TicketStatus;
    if (query?.requesterId) where.requesterId = query.requesterId;
    return this.prisma.supportTicket.findMany({
      where,
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      skip,
      take: limit,
    });
  }

  listByRequester(requesterId: string) {
    return this.prisma.supportTicket.findMany({
      where: { requesterId },
      orderBy: { createdAt: "desc" },
      include: { replies: { orderBy: { createdAt: "asc" } } },
    });
  }

  async get(id: string) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id }, include: { replies: { orderBy: { createdAt: "asc" } } } });
    if (!ticket) throw new NotFoundException("Ticket not found.");
    return ticket;
  }

  async create(dto: CreateTicketDto, actor?: ActorInfo) {
    const ticket = await this.prisma.supportTicket.create({ data: dto });
    if (actor) await this.auditLogs.create(actor, AdminAuditAction.ticket_create, "SupportTicket", ticket.id, { subject: ticket.subject });
    return ticket;
  }

  async update(id: string, dto: UpdateTicketDto, actor?: ActorInfo) {
    const previous = await this.get(id);
    const data: Prisma.SupportTicketUpdateInput = {
      assignedTo: dto.assignedTo,
      status: dto.status as TicketStatus | undefined,
      priority: dto.priority as TicketPriority | undefined,
    };
    if (dto.status === "closed") data.closedAt = new Date();
    const ticket = await this.prisma.supportTicket.update({ where: { id }, data });
    if (dto.message) {
      const replyAuthorId = actor?.id ?? dto.assignedTo ?? "unknown";
      await this.prisma.supportTicketReply.create({ data: { ticketId: ticket.id, authorId: replyAuthorId, message: dto.message } });
      if (actor) await this.auditLogs.create(actor, AdminAuditAction.ticket_reply, "SupportTicketReply", ticket.id, { ticketId: ticket.id });
    }
    if (dto.status && actor) await this.auditLogs.create(actor, AdminAuditAction.ticket_status_change, "SupportTicket", id, { status: dto.status });
    if (dto.priority && actor) await this.auditLogs.create(actor, AdminAuditAction.ticket_status_change, "SupportTicket", id, { priority: dto.priority });
    if (dto.status === "closed" && previous.status !== "closed") {
      await this.notifications.create(
        previous.requesterId,
        `Ticket cerrado: ${ticket.subject}`,
        `Tu ticket "${ticket.subject}" ha sido cerrado por el equipo de soporte.`,
        ticket.id,
      );
    }
    return ticket;
  }

  async delete(id: string, actor?: ActorInfo) {
    const ticket = await this.get(id);
    await this.prisma.supportTicket.delete({ where: { id } });
    if (actor) await this.auditLogs.create(actor, AdminAuditAction.ticket_delete, "SupportTicket", id, { subject: ticket.subject });
    return ticket;
  }
}
