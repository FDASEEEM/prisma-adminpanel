import { Injectable, NotFoundException } from "@nestjs/common";
import { AdminAuditAction, Prisma } from "@prisma/client";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { AuditLogsService, ActorInfo } from "../audit-logs/audit-logs.service";
import { CreateAnnouncementDto } from "./dto/create-announcement.dto";
import { UpdateAnnouncementDto } from "./dto/update-announcement.dto";
import { PaginationDto } from "./dto/pagination.dto";

@Injectable()
export class AnnouncementsService {
  constructor(private readonly prisma: PrismaService, private readonly auditLogs: AuditLogsService) {}

  listActive() {
    return this.prisma.announcement.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });
  }

  list(query?: PaginationDto) {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 50;
    const skip = (page - 1) * limit;
    const where: Prisma.AnnouncementWhereInput = {};
    if (query?.isActive !== undefined) where.isActive = query.isActive;
    if (query?.audience) where.audience = query.audience as any;
    return this.prisma.announcement.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit });
  }

  async get(id: string) {
    const announcement = await this.prisma.announcement.findUnique({ where: { id } });
    if (!announcement) throw new NotFoundException("Announcement not found.");
    return announcement;
  }

  async create(dto: CreateAnnouncementDto, actor?: ActorInfo) {
    const announcement = await this.prisma.announcement.create({ data: { ...dto, startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined, endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined } });
    if (actor) await this.auditLogs.create(actor, AdminAuditAction.announcement_create, "Announcement", announcement.id, { title: announcement.title });
    return announcement;
  }

  async update(id: string, dto: UpdateAnnouncementDto, actor?: ActorInfo) {
    await this.get(id);
    const announcement = await this.prisma.announcement.update({ where: { id }, data: { title: dto.title, body: dto.body, audience: dto.audience, isActive: dto.isActive, startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined, endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined } });
    if (actor) await this.auditLogs.create(actor, AdminAuditAction.announcement_update, "Announcement", id, { title: announcement.title });
    return announcement;
  }

  async delete(id: string, actor?: ActorInfo) {
    const announcement = await this.get(id);
    await this.prisma.announcement.delete({ where: { id } });
    if (actor) await this.auditLogs.create(actor, AdminAuditAction.announcement_delete, "Announcement", id, { title: announcement.title });
    return announcement;
  }
}
