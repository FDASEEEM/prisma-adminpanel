import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AdminAuthGuard } from "../../auth/guards/admin-auth.guard";
import { CreateTicketDto } from "./dto/create-ticket.dto";
import { UpdateTicketDto } from "./dto/update-ticket.dto";
import { PaginationDto } from "./dto/pagination.dto";
import { TicketsService } from "./tickets.service";

type AdminUser = { id: string; email?: string; nombreCompleto?: string };

@ApiTags("tickets")
@Controller("admin/tickets")
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard)
  @ApiOperation({ summary: "Listar tickets" })
  list(@Query() query?: PaginationDto) {
    return this.ticketsService.list(query);
  }

  @Get("by-requester/:requesterId")
  @ApiOperation({ summary: "Listar tickets de un profesor (público)" })
  listByRequester(@Param("requesterId") requesterId: string) {
    return this.ticketsService.listByRequester(requesterId);
  }

  @Get(":id")
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard)
  @ApiOperation({ summary: "Obtener ticket con respuestas" })
  get(@Param("id") id: string) {
    return this.ticketsService.get(id);
  }

  @Post()
  @ApiOperation({ summary: "Crear ticket" })
  create(@Body() dto: CreateTicketDto) {
    return this.ticketsService.create(dto);
  }

  @Patch(":id")
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard)
  @ApiOperation({ summary: "Actualizar ticket" })
  update(@Param("id") id: string, @Body() dto: UpdateTicketDto, @Req() request: Request & { adminUser?: AdminUser }) {
    return this.ticketsService.update(id, dto, request.adminUser ? { id: request.adminUser.id, email: request.adminUser.email, name: request.adminUser.nombreCompleto } : undefined);
  }

  @Delete(":id")
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard)
  @ApiOperation({ summary: "Eliminar ticket" })
  delete(@Param("id") id: string, @Req() request: Request & { adminUser?: AdminUser }) {
    return this.ticketsService.delete(id, request.adminUser ? { id: request.adminUser.id, email: request.adminUser.email, name: request.adminUser.nombreCompleto } : undefined);
  }
}
