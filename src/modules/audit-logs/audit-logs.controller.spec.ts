import { Test, TestingModule } from "@nestjs/testing";
import { AuditLogsController } from "./audit-logs.controller";
import { AuditLogsService } from "./audit-logs.service";
import { UsersApiClient } from "../../infrastructure/users-api/users-api.client";
import { AdminAuthGuard } from "../../auth/guards/admin-auth.guard";

const mockAuditLogsService = () => ({ list: jest.fn() });
const mockUsersApiClient = () => ({ listUsers: jest.fn() });

describe("AuditLogsController", () => {
  let controller: AuditLogsController;
  let auditLogsService: ReturnType<typeof mockAuditLogsService>;
  let usersApiClient: ReturnType<typeof mockUsersApiClient>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditLogsController],
      providers: [
        { provide: AuditLogsService, useFactory: mockAuditLogsService },
        { provide: UsersApiClient, useFactory: mockUsersApiClient },
      ],
    })
      .overrideGuard(AdminAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuditLogsController>(AuditLogsController);
    auditLogsService = module.get(AuditLogsService) as any;
    usersApiClient = module.get(UsersApiClient) as any;
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("list", () => {
    it("should return logs as-is when no auth header", async () => {
      const logs = [{ id: "l1", actorId: "u1", metadata: {} }];
      auditLogsService.list.mockResolvedValue(logs);
      const request: any = { headers: {} };

      const result = await controller.list(request);

      expect(result).toEqual(logs);
      expect(usersApiClient.listUsers).not.toHaveBeenCalled();
    });

    it("should return logs as-is when empty", async () => {
      auditLogsService.list.mockResolvedValue([]);
      const request: any = { headers: { authorization: "Bearer token" } };

      const result = await controller.list(request);

      expect(result).toEqual([]);
      expect(usersApiClient.listUsers).not.toHaveBeenCalled();
    });

    it("should enrich logs with user info when token present", async () => {
      const logs = [{ id: "l1", actorId: "u1", metadata: {} }];
      auditLogsService.list.mockResolvedValue(logs);
      usersApiClient.listUsers.mockResolvedValue([{ id: "u1", email: "u@u.com", nombreCompleto: "User" }]);
      const request: any = { headers: { authorization: "Bearer token" } };

      const result = await controller.list(request);

      expect(usersApiClient.listUsers).toHaveBeenCalledWith("token");
      expect(result).toEqual([{ id: "l1", actorId: "u1", metadata: {}, actorEmail: "u@u.com", actorName: "User" }]);
    });

    it("should fall back to logs when listUsers throws", async () => {
      const logs = [{ id: "l1", actorId: "u1", metadata: {} }];
      auditLogsService.list.mockResolvedValue(logs);
      usersApiClient.listUsers.mockRejectedValue(new Error("fail"));
      const request: any = { headers: { authorization: "Bearer token" } };

      const result = await controller.list(request);

      expect(result).toEqual(logs);
    });
  });
});
