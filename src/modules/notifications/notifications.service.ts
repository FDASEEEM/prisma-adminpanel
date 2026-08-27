import { Injectable, ForbiddenException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async listByUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async listUnreadByUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId, read: false },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(userId: string, title: string, message: string, ticketId?: string) {
    return this.prisma.notification.create({
      data: { userId, title, message, ticketId },
    });
  }

  async markAsRead(id: string, userId?: string) {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification) throw new NotFoundException("Notification not found.");
    if (userId && notification.userId !== userId) {
      throw new ForbiddenException("You cannot modify this notification.");
    }
    return this.prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }
}
