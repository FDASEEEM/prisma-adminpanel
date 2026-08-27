import { Body, Controller, Delete, ForbiddenException, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AdminAuthGuard } from "../../auth/guards/admin-auth.guard";
import { UserAuthGuard } from "../../auth/guards/user-auth.guard";
import { CreateTicketDto } from "./dto/create-ticket.dto";
import { UpdateTicketDto } from "./dto/update-ticket.dto";
import { PaginationDto } from "./dto/pagination.dto";
import { TicketsService } from "./tickets.service";

type AuthUser = { id: string; role?: string; email?: string; nombreCompleto?: string };

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
  @ApiBearerAuth()
  @UseGuards(UserAuthGuard)
  @ApiOperation({ summary: "Listar tickets de un solicitante (solo los propios salvo admin)" })
  listByRequester(
    @Param("requesterId") requesterId: string,
    @Req() request: Request & { user?: AuthUser },
  ) {
    const user = (request as any).user as AuthUser;
    if (user.role !== "ADMIN" && user.role !== "SUPERADMIN" && user.id !== requesterId) {
      throw new ForbiddenException("You can only view your own tickets.");
    }
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
  @ApiBearerAuth()
  @UseGuards(UserAuthGuard)
  @ApiOperation({ summary: "Crear ticket" })
  create(@Body() dto: CreateTicketDto, @Req() request: Request & { user?: AuthUser }) {
    const user = (request as any).user as AuthUser;
    // El solicitante es el usuario autenticado salvo que un admin lo indique.
    dto.requesterId = dto.requesterId || user.id;
    if (user.role !== "ADMIN" && user.role !== "SUPERADMIN" && dto.requesterId !== user.id) {
      throw new ForbiddenException("You can only create tickets for yourself.");
    }
    return this.ticketsService.create(dto, { id: user.id, email: user.email, name: user.nombreCompleto });
  }

  @Patch(":id")
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard)
  @ApiOperation({ summary: "Actualizar ticket" })
  update(@Param("id") id: string, @Body() dto: UpdateTicketDto, @Req() request: Request & { adminUser?: AuthUser }) {
    const admin = request.adminUser as AuthUser | undefined;
    return this.ticketsService.update(id, dto, admin ? { id: admin.id, email: admin.email, name: admin.nombreCompleto } : undefined);
  }

  @Delete(":id")
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard)
  @ApiOperation({ summary: "Eliminar ticket" })
  delete(@Param("id") id: string, @Req() request: Request & { adminUser?: AuthUser }) {
    const admin = request.adminUser as AuthUser | undefined;
    return this.ticketsService.delete(id, admin ? { id: admin.id, email: admin.email, name: admin.nombreCompleto } : undefined);
  }
}
