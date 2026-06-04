import { Controller, Get, Param, Patch, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { NotificationsService } from "./notifications.service";

@ApiTags("notifications")
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: "Listar notificaciones de un usuario" })
  list(@Query("userId") userId: string) {
    return this.notificationsService.listByUser(userId);
  }

  @Get("unread")
  @ApiOperation({ summary: "Listar notificaciones no leídas de un usuario" })
  unread(@Query("userId") userId: string) {
    return this.notificationsService.listUnreadByUser(userId);
  }

  @Patch(":id/read")
  @ApiOperation({ summary: "Marcar notificación como leída" })
  markAsRead(@Param("id") id: string) {
    return this.notificationsService.markAsRead(id);
  }
}
