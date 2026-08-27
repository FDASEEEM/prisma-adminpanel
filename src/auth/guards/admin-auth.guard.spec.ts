import { Test, TestingModule } from "@nestjs/testing";
import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { RolesService } from "../roles.service";
import { AdminAuthGuard } from "./admin-auth.guard";

const mockRolesService = () => ({ assertAdmin: jest.fn() });

const buildContext = (request: any): ExecutionContext =>
  ({
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext);

describe("AdminAuthGuard", () => {
  let guard: AdminAuthGuard;
  let rolesService: ReturnType<typeof mockRolesService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminAuthGuard,
        { provide: RolesService, useFactory: mockRolesService },
      ],
    }).compile();

    guard = module.get<AdminAuthGuard>(AdminAuthGuard);
    rolesService = module.get(RolesService) as any;
  });

  it("should be defined", () => {
    expect(guard).toBeDefined();
  });

  describe("canActivate", () => {
    it("should throw UnauthorizedException when no authorization header", async () => {
      const context = buildContext({ headers: {} });

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it("should throw UnauthorizedException when header is not Bearer", async () => {
      const context = buildContext({ headers: { authorization: "Basic abc" } });

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it("should return true and set adminUser on success", async () => {
      const adminUser = { id: "u1", email: "u@u.com", role: "ADMIN", nombreCompleto: "User" };
      rolesService.assertAdmin.mockResolvedValue(adminUser);
      const request: any = { headers: { authorization: "Bearer token123" } };
      const context = buildContext(request);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(request.adminUser).toEqual(adminUser);
      expect(rolesService.assertAdmin).toHaveBeenCalledWith("token123");
    });

    it("should propagate the real error thrown by assertAdmin (not mask it)", async () => {
      const original = new UnauthorizedException("Invalid credentials.");
      rolesService.assertAdmin.mockRejectedValue(original);
      const request: any = { headers: { authorization: "Bearer token123" } };
      const context = buildContext(request);

      await expect(guard.canActivate(context)).rejects.toBe(original);
    });
  });
});
