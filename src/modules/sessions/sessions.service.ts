import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { CreateSessionDto } from "./dto/create-session.dto";

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  listActive() {
    return this.prisma.adminSession.findMany({ where: { isActive: true, isBlocked: false }, orderBy: { lastAccess: "desc" } });
  }

  listHistorical() {
    return this.prisma.adminSession.findMany({ where: { OR: [{ isActive: false }, { isBlocked: true }] }, orderBy: { createdAt: "desc" } });
  }

  listBlocked() {
    return this.prisma.adminSession.findMany({ where: { isBlocked: true }, orderBy: { lastAccess: "desc" } });
  }

  listByUser(userId: string) {
    return this.prisma.adminSession.findMany({ where: { userId }, orderBy: { lastAccess: "desc" } });
  }

  async block(id: string) {
    const session = await this.getSession(id);
    return this.prisma.adminSession.update({ where: { id }, data: { isBlocked: true, isActive: false } });
  }

  async unblock(id: string) {
    const session = await this.getSession(id);
    return this.prisma.adminSession.update({ where: { id }, data: { isBlocked: false, isActive: true } });
  }

  async terminate(id: string) {
    const session = await this.getSession(id);
    return this.prisma.adminSession.update({ where: { id }, data: { isActive: false } });
  }

  create(dto: CreateSessionDto) {
    return this.prisma.adminSession.create({ data: { userId: dto.userId, tokenHash: dto.tokenHash, userAgent: dto.userAgent, ipAddress: dto.ipAddress, expiresAt: new Date(dto.expiresAt) } });
  }

  async recordAccess(id: string) {
    await this.getSession(id);
    return this.prisma.adminSession.update({ where: { id }, data: { lastAccess: new Date() } });
  }

  async cleanupExpired() {
    return this.prisma.adminSession.updateMany({ where: { expiresAt: { lt: new Date() }, isActive: true }, data: { isActive: false } });
  }

  private async getSession(id: string) {
    const session = await this.prisma.adminSession.findUnique({ where: { id } });
    if (!session) throw new NotFoundException("Session not found.");
    return session;
  }
}
