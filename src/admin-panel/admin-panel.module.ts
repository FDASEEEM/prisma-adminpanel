import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { InfrastructureModule } from "../infrastructure/infrastructure.module";
import { AuditLogsModule } from "../modules/audit-logs/audit-logs.module";
import { AdminPanelController } from "./admin-panel.controller";
import { AdminPanelService } from "./admin-panel.service";

@Module({
  imports: [AuthModule, InfrastructureModule, AuditLogsModule],
  controllers: [AdminPanelController],
  providers: [AdminPanelService],
})
export class AdminPanelModule {}
