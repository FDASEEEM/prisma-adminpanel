import { Module } from "@nestjs/common";
import { RolesService } from "./roles.service";
import { InfrastructureModule } from "../infrastructure/infrastructure.module";

@Module({
  imports: [InfrastructureModule],
  providers: [RolesService],
  exports: [RolesService],
})
export class AuthModule {}
