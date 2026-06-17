import { Module } from "@nestjs/common";
import { JobsApiClient } from "./jobs-api.client";

@Module({
  providers: [JobsApiClient],
  exports: [JobsApiClient],
})
export class JobsApiModule {}
