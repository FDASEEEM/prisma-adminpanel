import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module";
import { InfrastructureModule } from "../../infrastructure/infrastructure.module";
import { AuditLogsModule } from "../audit-logs/audit-logs.module";
import { AnnouncementsController } from "./announcements.controller";
import { AnnouncementsService } from "./announcements.service";

@Module({
  imports: [AuthModule, InfrastructureModule, AuditLogsModule],
  controllers: [AnnouncementsController],
  providers: [AnnouncementsService],
})
export class AnnouncementsModule {}
