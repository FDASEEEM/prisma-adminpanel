import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module";
import { InfrastructureModule } from "../../infrastructure/infrastructure.module";
import { AuditLogsModule } from "../audit-logs/audit-logs.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { TicketsController } from "./tickets.controller";
import { TicketsService } from "./tickets.service";

@Module({
  imports: [AuthModule, InfrastructureModule, AuditLogsModule, NotificationsModule],
  controllers: [TicketsController],
  providers: [TicketsService],
})
export class TicketsModule {}
