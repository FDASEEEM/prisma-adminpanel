import { Injectable } from "@nestjs/common";
import { ForbiddenException } from "@nestjs/common";
import { UsersApiClient } from "../infrastructure/users-api/users-api.client";

@Injectable()
export class RolesService {
  constructor(private readonly usersApiClient: UsersApiClient) {}

  async assertAdmin(accessToken: string) {
    const profile = await this.usersApiClient.getCurrentUser(accessToken);
    if (profile.role !== "ADMIN" && profile.role !== "SUPERADMIN") {
      throw new ForbiddenException("Admin role required.");
    }
    return profile;
  }
}
