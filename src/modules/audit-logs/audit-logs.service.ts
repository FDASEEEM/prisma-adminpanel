import { Injectable } from "@nestjs/common";
import { AdminAuditAction, Prisma } from "@prisma/client";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";

export type ActorInfo = { id: string; name?: string; email?: string };

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.adminAuditLog.findMany({ orderBy: { createdAt: "desc" } });
  }

  create(actor: string | ActorInfo, action: AdminAuditAction, entity: string, entityId?: string, metadata?: Record<string, unknown>) {
    const actorId = typeof actor === "string" ? actor : actor.id;
    const enrichedMetadata: Record<string, unknown> = { ...metadata };
    if (typeof actor !== "string") {
      if (actor.name) enrichedMetadata.actorName = actor.name;
      if (actor.email) enrichedMetadata.actorEmail = actor.email;
    }
    return this.prisma.adminAuditLog.create({
      data: { actorId, action, entity, entityId, metadata: Object.keys(enrichedMetadata).length ? enrichedMetadata as Prisma.InputJsonValue : Prisma.JsonNull },
    });
  }
}
