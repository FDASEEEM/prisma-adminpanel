import { Module } from "@nestjs/common";
import { RolesService } from "./roles.service";
import { UserAuthGuard } from "./guards/user-auth.guard";
import { InfrastructureModule } from "../infrastructure/infrastructure.module";

@Module({
  imports: [InfrastructureModule],
  providers: [RolesService, UserAuthGuard],
  exports: [RolesService, UserAuthGuard],
})
export class AuthModule {}
