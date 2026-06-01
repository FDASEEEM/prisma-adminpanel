import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module";
import { InfrastructureModule } from "../../infrastructure/infrastructure.module";
import { AuditLogsModule } from "../audit-logs/audit-logs.module";
import { SessionsController } from "./sessions.controller";
import { SessionsService } from "./sessions.service";

@Module({
  imports: [AuthModule, InfrastructureModule, AuditLogsModule],
  controllers: [SessionsController],
  providers: [SessionsService],
})
export class SessionsModule {}
