import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { UsersApiModule } from "./users-api/users-api.module";

@Module({
  imports: [PrismaModule, UsersApiModule],
  exports: [PrismaModule, UsersApiModule],
})
export class InfrastructureModule {}
