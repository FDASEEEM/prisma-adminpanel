import { Injectable } from "@nestjs/common";
import { PrismaService } from "../infrastructure/prisma/prisma.service";

@Injectable()
export class AdminPanelService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardSummary(actorId?: string) {
    const [openTickets, publishedAnnouncements, totalResources, totalProfessors, activeSessions] =
      await Promise.all([
        this.prisma.supportTicket.count({ where: { status: "open" } }),
        this.prisma.announcement.count({ where: { isActive: true } }),
        this.prisma.resourceMaterial.count(),
        this.prisma.professor.count({ where: { isActive: true } }),
        this.prisma.adminSession.count({ where: { isActive: true, isBlocked: false } }),
      ]);

    const recentTickets = await this.prisma.supportTicket.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, subject: true, status: true, createdAt: true },
    });

    return {
      actorId,
      kpis: { openTickets, publishedAnnouncements, totalResources, activeProfessors: totalProfessors, activeSessions },
      recentTickets,
    };
  }
}
