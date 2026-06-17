import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AdminAuthGuard } from "../../auth/guards/admin-auth.guard";
import { CreateProfessorDto } from "./dto/create-professor.dto";
import { UpdateProfessorDto } from "./dto/update-professor.dto";
import { PaginationDto } from "./dto/pagination.dto";
import { ProfessorsService } from "./professors.service";

type AdminUser = { id: string; email?: string; nombreCompleto?: string; colegioId?: string | null };

@ApiTags("professors")
@ApiBearerAuth()
@UseGuards(AdminAuthGuard)
@Controller("admin/professors")
export class ProfessorsController {
  constructor(private readonly professorsService: ProfessorsService) {}

  @Get()
  @ApiOperation({ summary: "Listar profesores" })
  list(@Query() query: PaginationDto, @Req() request: Request & { adminUser?: AdminUser }) {
    const colegioId = request.adminUser?.colegioId;
    return this.professorsService.list(query, colegioId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Obtener profesor" })
  get(@Param("id") id: string) {
    return this.professorsService.get(id);
  }

  @Post()
  @ApiOperation({ summary: "Crear profesor" })
  create(@Body() dto: CreateProfessorDto, @Req() request: Request & { adminUser?: AdminUser }) {
    const authHeader = request.headers.authorization;
    const accessToken = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : undefined;
    if (!dto.colegioId && request.adminUser?.colegioId) {
      dto.colegioId = request.adminUser.colegioId;
    }
    return this.professorsService.create(dto, request.adminUser ? { id: request.adminUser.id, email: request.adminUser.email, name: request.adminUser.nombreCompleto } : undefined, accessToken);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Actualizar profesor" })
  update(@Param("id") id: string, @Body() dto: UpdateProfessorDto, @Req() request: Request & { adminUser?: AdminUser }) {
    return this.professorsService.update(id, dto, request.adminUser ? { id: request.adminUser.id, email: request.adminUser.email, name: request.adminUser.nombreCompleto } : undefined);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Eliminar profesor" })
  delete(@Param("id") id: string, @Req() request: Request & { adminUser?: AdminUser }) {
    return this.professorsService.delete(id, request.adminUser ? { id: request.adminUser.id, email: request.adminUser.email, name: request.adminUser.nombreCompleto } : undefined);
  }
}
