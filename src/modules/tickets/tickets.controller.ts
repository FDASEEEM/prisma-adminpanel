import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AdminAuthGuard } from "../../auth/guards/admin-auth.guard";
import { CreateTicketDto } from "./dto/create-ticket.dto";
import { UpdateTicketDto } from "./dto/update-ticket.dto";
import { PaginationDto } from "./dto/pagination.dto";
import { TicketsService } from "./tickets.service";

@ApiTags("tickets")
@ApiBearerAuth()
@UseGuards(AdminAuthGuard)
@Controller("admin/tickets")
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  @ApiOperation({ summary: "Listar tickets" })
  list(@Query() query?: PaginationDto) {
    return this.ticketsService.list(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Obtener ticket con respuestas" })
  get(@Param("id") id: string) {
    return this.ticketsService.get(id);
  }

  @Post()
  @ApiOperation({ summary: "Crear ticket" })
  create(@Body() dto: CreateTicketDto, @Req() request: Request & { adminUser?: { id: string } }) {
    return this.ticketsService.create(dto, request.adminUser?.id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Actualizar ticket" })
  update(@Param("id") id: string, @Body() dto: UpdateTicketDto, @Req() request: Request & { adminUser?: { id: string } }) {
    return this.ticketsService.update(id, dto, request.adminUser?.id);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Eliminar ticket" })
  delete(@Param("id") id: string, @Req() request: Request & { adminUser?: { id: string } }) {
    return this.ticketsService.delete(id, request.adminUser?.id);
  }
}
