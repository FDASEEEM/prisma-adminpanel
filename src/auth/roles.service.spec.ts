import { Test, TestingModule } from "@nestjs/testing";
import { ForbiddenException } from "@nestjs/common";
import { UsersApiClient } from "../infrastructure/users-api/users-api.client";
import { RolesService } from "./roles.service";

const mockUsersApiClient = () => ({ getCurrentUser: jest.fn() });

describe("RolesService", () => {
  let service: RolesService;
  let usersApiClient: ReturnType<typeof mockUsersApiClient>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RolesService, { provide: UsersApiClient, useFactory: mockUsersApiClient }],
    }).compile();

    service = module.get<RolesService>(RolesService);
    usersApiClient = module.get(UsersApiClient) as any;
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("assertAdmin", () => {
    it("should return profile when role is ADMIN", async () => {
      const profile = { id: "u1", role: "ADMIN" };
      usersApiClient.getCurrentUser.mockResolvedValue(profile);

      const result = await service.assertAdmin("token");

      expect(usersApiClient.getCurrentUser).toHaveBeenCalledWith("token");
      expect(result).toEqual(profile);
    });

    it("should return profile when role is SUPERADMIN", async () => {
      const profile = { id: "u1", role: "SUPERADMIN" };
      usersApiClient.getCurrentUser.mockResolvedValue(profile);

      const result = await service.assertAdmin("token");

      expect(result).toEqual(profile);
    });

    it("should throw ForbiddenException when role is TEACHER", async () => {
      usersApiClient.getCurrentUser.mockResolvedValue({ id: "u1", role: "TEACHER" });

      await expect(service.assertAdmin("token")).rejects.toThrow(ForbiddenException);
    });
  });
});
