import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AdminAuthGuard } from "../../auth/guards/admin-auth.guard";
import { CreateProfessorDto } from "./dto/create-professor.dto";
import { UpdateProfessorDto } from "./dto/update-professor.dto";
import { PaginationDto } from "./dto/pagination.dto";
import { ProfessorsService } from "./professors.service";

@ApiTags("professors")
@ApiBearerAuth()
@UseGuards(AdminAuthGuard)
@Controller("admin/professors")
export class ProfessorsController {
  constructor(private readonly professorsService: ProfessorsService) {}

  @Get()
  @ApiOperation({ summary: "Listar profesores" })
  list(@Query() query?: PaginationDto) {
    return this.professorsService.list(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Obtener profesor" })
  get(@Param("id") id: string) {
    return this.professorsService.get(id);
  }

  @Post()
  @ApiOperation({ summary: "Crear profesor" })
  create(@Body() dto: CreateProfessorDto, @Req() request: Request & { adminUser?: { id: string } }) {
    return this.professorsService.create(dto, request.adminUser?.id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Actualizar profesor" })
  update(@Param("id") id: string, @Body() dto: UpdateProfessorDto, @Req() request: Request & { adminUser?: { id: string } }) {
    return this.professorsService.update(id, dto, request.adminUser?.id);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Eliminar profesor" })
  delete(@Param("id") id: string, @Req() request: Request & { adminUser?: { id: string } }) {
    return this.professorsService.delete(id, request.adminUser?.id);
  }
}
