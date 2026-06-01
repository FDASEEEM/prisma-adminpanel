import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AdminAuthGuard } from "../../auth/guards/admin-auth.guard";
import { CreateAnnouncementDto } from "./dto/create-announcement.dto";
import { UpdateAnnouncementDto } from "./dto/update-announcement.dto";
import { PaginationDto } from "./dto/pagination.dto";
import { AnnouncementsService } from "./announcements.service";

@ApiTags("announcements")
@ApiBearerAuth()
@UseGuards(AdminAuthGuard)
@Controller("admin/announcements")
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Get()
  @ApiOperation({ summary: "Listar anuncios" })
  list(@Query() query?: PaginationDto) {
    return this.announcementsService.list(query);
  }

  @Post()
  @ApiOperation({ summary: "Crear anuncio" })
  create(@Body() dto: CreateAnnouncementDto, @Req() request: Request & { adminUser?: { id: string } }) {
    return this.announcementsService.create(dto, request.adminUser?.id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Actualizar anuncio" })
  update(@Param("id") id: string, @Body() dto: UpdateAnnouncementDto, @Req() request: Request & { adminUser?: { id: string } }) {
    return this.announcementsService.update(id, dto, request.adminUser?.id);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Eliminar anuncio" })
  delete(@Param("id") id: string, @Req() request: Request & { adminUser?: { id: string } }) {
    return this.announcementsService.delete(id, request.adminUser?.id);
  }
}
