import { Injectable } from "@nestjs/common";
import { AdminAuditAction, Prisma } from "@prisma/client";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.adminAuditLog.findMany({ orderBy: { createdAt: "desc" } });
  }

  create(actorId: string, action: AdminAuditAction, entity: string, entityId?: string, metadata?: Record<string, unknown>) {
    return this.prisma.adminAuditLog.create({
      data: { actorId, action, entity, entityId, metadata: metadata as Prisma.InputJsonValue },
    });
  }
}
