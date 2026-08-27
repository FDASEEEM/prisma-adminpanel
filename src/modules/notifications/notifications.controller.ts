import { Controller, Get, Param, Patch, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { UserAuthGuard } from "../../auth/guards/user-auth.guard";
import { NotificationsService } from "./notifications.service";

@ApiTags("notifications")
@ApiBearerAuth()
@Controller("notifications")
@UseGuards(UserAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: "Listar notificaciones del usuario autenticado" })
  list(@Req() request: Request & { user?: { id: string } }) {
    return this.notificationsService.listByUser((request as any).user.id);
  }

  @Get("unread")
  @ApiOperation({ summary: "Listar notificaciones no leídas del usuario autenticado" })
  unread(@Req() request: Request & { user?: { id: string } }) {
    return this.notificationsService.listUnreadByUser((request as any).user.id);
  }

  @Patch(":id/read")
  @ApiOperation({ summary: "Marcar notificación como leída" })
  markAsRead(
    @Param("id") id: string,
    @Req() request: Request & { user?: { id: string } },
  ) {
    return this.notificationsService.markAsRead(id, (request as any).user.id);
  }
}
