import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module";
import { InfrastructureModule } from "../../infrastructure/infrastructure.module";
import { AuditLogsModule } from "../audit-logs/audit-logs.module";
import { ProfessorsController } from "./professors.controller";
import { ProfessorsService } from "./professors.service";

@Module({
  imports: [AuthModule, InfrastructureModule, AuditLogsModule],
  controllers: [ProfessorsController],
  providers: [ProfessorsService],
})
export class ProfessorsModule {}
