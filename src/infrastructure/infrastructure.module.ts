import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { UsersApiModule } from "./users-api/users-api.module";
import { JobsApiModule } from "./jobs-api/jobs-api.module";

@Module({
  imports: [PrismaModule, UsersApiModule, JobsApiModule],
  exports: [PrismaModule, UsersApiModule, JobsApiModule],
})
export class InfrastructureModule {}
