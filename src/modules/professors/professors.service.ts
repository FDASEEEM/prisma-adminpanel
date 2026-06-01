import { Injectable, NotFoundException } from "@nestjs/common";
import { AdminAuditAction, Prisma } from "@prisma/client";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { UsersApiClient } from "../../infrastructure/users-api/users-api.client";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { CreateProfessorDto } from "./dto/create-professor.dto";
import { UpdateProfessorDto } from "./dto/update-professor.dto";
import { PaginationDto } from "./dto/pagination.dto";

@Injectable()
export class ProfessorsService {
  constructor(private readonly prisma: PrismaService, private readonly auditLogs: AuditLogsService, private readonly usersApiClient: UsersApiClient) {}

  list(query?: PaginationDto) {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 50;
    const skip = (page - 1) * limit;
    const where: Prisma.ProfessorWhereInput = {};
    if (query?.isActive !== undefined) where.isActive = query.isActive;
    if (query?.especialidad) where.especialidad = { contains: query.especialidad, mode: "insensitive" };
    return this.prisma.professor.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit });
  }

  async get(id: string) {
    const professor = await this.prisma.professor.findUnique({ where: { id } });
    if (!professor) throw new NotFoundException("Professor not found.");
    return professor;
  }

  async getByUserId(userId: string) {
    const professor = await this.prisma.professor.findUnique({ where: { userId } });
    if (!professor) throw new NotFoundException("Professor not found for this user.");
    return professor;
  }

  async create(dto: CreateProfessorDto, actorId?: string) {
    let userId = dto.userId;
    if (!userId && dto.email && dto.nombreCompleto) {
      const createdUser = await this.usersApiClient.createProfessorUser({ email: dto.email, nombreCompleto: dto.nombreCompleto });
      userId = createdUser.id;
    }
    if (!userId) throw new NotFoundException("userId or email+nombreCompleto is required.");
    const professor = await this.prisma.professor.create({ data: { userId, nombreCompleto: dto.nombreCompleto, email: dto.email, especialidad: dto.especialidad, telefono: dto.telefono, isActive: dto.isActive ?? true } });
    if (actorId) await this.auditLogs.create(actorId, AdminAuditAction.teacher_create, "Professor", professor.id, { email: professor.email, nombreCompleto: professor.nombreCompleto });
    return professor;
  }

  async update(id: string, dto: UpdateProfessorDto, actorId?: string) {
    await this.get(id);
    const professor = await this.prisma.professor.update({ where: { id }, data: { nombreCompleto: dto.nombreCompleto, email: dto.email, especialidad: dto.especialidad, telefono: dto.telefono, isActive: dto.isActive } });
    if (actorId) await this.auditLogs.create(actorId, AdminAuditAction.teacher_update, "Professor", id, { email: professor.email });
    return professor;
  }

  async delete(id: string, actorId?: string) {
    const professor = await this.get(id);
    await this.prisma.professor.delete({ where: { id } });
    if (actorId) await this.auditLogs.create(actorId, AdminAuditAction.teacher_delete, "Professor", id, { email: professor.email });
    return professor;
  }
}
