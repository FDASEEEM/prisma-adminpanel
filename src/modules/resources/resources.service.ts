import { Injectable, NotFoundException } from "@nestjs/common";
import { AdminAuditAction, Prisma } from "@prisma/client";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { AuditLogsService, ActorInfo } from "../audit-logs/audit-logs.service";
import { CreateResourceDto } from "./dto/create-resource.dto";
import { UpdateResourceDto } from "./dto/update-resource.dto";
import { PaginationDto } from "./dto/pagination.dto";

@Injectable()
export class ResourcesService {
  constructor(private readonly prisma: PrismaService, private readonly auditLogs: AuditLogsService) {}

  list(query?: PaginationDto) {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 50;
    const skip = (page - 1) * limit;
    const where: Prisma.ResourceMaterialWhereInput = {};
    if (query?.type) where.type = query.type as any;
    return this.prisma.resourceMaterial.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit });
  }

  async get(id: string) {
    const resource = await this.prisma.resourceMaterial.findUnique({ where: { id } });
    if (!resource) throw new NotFoundException("Resource not found.");
    return resource;
  }

  async create(dto: CreateResourceDto, actor?: ActorInfo) {
    const resource = await this.prisma.resourceMaterial.create({ data: dto });
    if (actor) await this.auditLogs.create(actor, AdminAuditAction.resource_create, "ResourceMaterial", resource.id, { title: resource.title });
    return resource;
  }

  async update(id: string, dto: UpdateResourceDto, actor?: ActorInfo) {
    await this.get(id);
    const resource = await this.prisma.resourceMaterial.update({ where: { id }, data: { title: dto.title, description: dto.description, type: dto.type, url: dto.url } });
    if (actor) await this.auditLogs.create(actor, AdminAuditAction.resource_update, "ResourceMaterial", id, { title: resource.title });
    return resource;
  }

  async delete(id: string, actor?: ActorInfo) {
    const resource = await this.get(id);
    await this.prisma.resourceMaterial.delete({ where: { id } });
    if (actor) await this.auditLogs.create(actor, AdminAuditAction.resource_delete, "ResourceMaterial", id, { title: resource.title });
    return resource;
  }
}
