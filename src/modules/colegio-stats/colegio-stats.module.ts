import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module";
import { InfrastructureModule } from "../../infrastructure/infrastructure.module";
import { ColegioStatsController } from "./colegio-stats.controller";
import { ColegioStatsService } from "./colegio-stats.service";

@Module({
  imports: [AuthModule, InfrastructureModule],
  controllers: [ColegioStatsController],
  providers: [ColegioStatsService],
  exports: [ColegioStatsService],
})
export class ColegioStatsModule {}
