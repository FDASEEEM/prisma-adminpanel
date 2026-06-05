import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AdminAuthGuard } from "../../auth/guards/admin-auth.guard";
import { CreateResourceDto } from "./dto/create-resource.dto";
import { UpdateResourceDto } from "./dto/update-resource.dto";
import { PaginationDto } from "./dto/pagination.dto";
import { ResourcesService } from "./resources.service";

type AdminUser = { id: string; email?: string; nombreCompleto?: string };

@ApiTags("resources")
@ApiBearerAuth()
@UseGuards(AdminAuthGuard)
@Controller("admin/resources")
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Get()
  @ApiOperation({ summary: "Listar recursos" })
  list(@Query() query?: PaginationDto) {
    return this.resourcesService.list(query);
  }

  @Post()
  @ApiOperation({ summary: "Crear recurso" })
  create(@Body() dto: CreateResourceDto, @Req() request: Request & { adminUser?: AdminUser }) {
    return this.resourcesService.create(dto, request.adminUser ? { id: request.adminUser.id, email: request.adminUser.email, name: request.adminUser.nombreCompleto } : undefined);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Actualizar recurso" })
  update(@Param("id") id: string, @Body() dto: UpdateResourceDto, @Req() request: Request & { adminUser?: AdminUser }) {
    return this.resourcesService.update(id, dto, request.adminUser ? { id: request.adminUser.id, email: request.adminUser.email, name: request.adminUser.nombreCompleto } : undefined);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Eliminar recurso" })
  delete(@Param("id") id: string, @Req() request: Request & { adminUser?: AdminUser }) {
    return this.resourcesService.delete(id, request.adminUser ? { id: request.adminUser.id, email: request.adminUser.email, name: request.adminUser.nombreCompleto } : undefined);
  }
}
