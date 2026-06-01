import { Module } from "@nestjs/common";
import { UsersApiClient } from "./users-api.client";

@Module({
  providers: [UsersApiClient],
  exports: [UsersApiClient],
})
export class UsersApiModule {}
