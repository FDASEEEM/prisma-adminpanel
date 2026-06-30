import { Test, TestingModule } from "@nestjs/testing";
import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/prisma/prisma.service";
import { RolesService } from "../roles.service";
import { AdminAuthGuard } from "./admin-auth.guard";

const mockRolesService = () => ({ assertAdmin: jest.fn() });
const mockPrismaService = () => ({ adminAuditLog: { findFirst: jest.fn(), create: jest.fn() } });

const buildContext = (request: any): ExecutionContext =>
  ({
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext);

describe("AdminAuthGuard", () => {
  let guard: AdminAuthGuard;
  let rolesService: ReturnType<typeof mockRolesService>;
  let prisma: ReturnType<typeof mockPrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminAuthGuard,
        { provide: RolesService, useFactory: mockRolesService },
        { provide: PrismaService, useFactory: mockPrismaService },
      ],
    }).compile();

    guard = module.get<AdminAuthGuard>(AdminAuthGuard);
    rolesService = module.get(RolesService) as any;
    prisma = module.get(PrismaService) as any;
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

    it("should return true, set adminUser, and create audit log when no recent login", async () => {
      const adminUser = { id: "u1", email: "u@u.com", nombreCompleto: "User" };
      rolesService.assertAdmin.mockResolvedValue(adminUser);
      prisma.adminAuditLog.findFirst.mockResolvedValue(null);
      const request: any = {
        headers: { authorization: "Bearer token123" },
        ip: "1.2.3.4",
        socket: { remoteAddress: "1.2.3.4" },
      };
      const context = buildContext(request);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(request.adminUser).toEqual(adminUser);
      expect(rolesService.assertAdmin).toHaveBeenCalledWith("token123");
      expect(prisma.adminAuditLog.findFirst).toHaveBeenCalled();
      expect(prisma.adminAuditLog.create).toHaveBeenCalledWith({
        data: {
          actorId: "u1",
          action: "login",
          entity: "auth",
          metadata: {
            actorEmail: "u@u.com",
            actorName: "User",
            ipAddress: "1.2.3.4",
            userAgent: null,
          },
        },
      });
    });

    it("should return true without creating audit log when recent login exists", async () => {
      const adminUser = { id: "u1", email: "u@u.com", nombreCompleto: "User" };
      rolesService.assertAdmin.mockResolvedValue(adminUser);
      prisma.adminAuditLog.findFirst.mockResolvedValue({ id: "log1" });
      const request: any = {
        headers: { authorization: "Bearer token123" },
        ip: "1.2.3.4",
        socket: { remoteAddress: "1.2.3.4" },
      };
      const context = buildContext(request);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(prisma.adminAuditLog.create).not.toHaveBeenCalled();
    });

    it("should throw UnauthorizedException when assertAdmin rejects", async () => {
      rolesService.assertAdmin.mockRejectedValue(new Error("invalid"));
      const request: any = { headers: { authorization: "Bearer token123" }, ip: "1.2.3.4", socket: { remoteAddress: "1.2.3.4" } };
      const context = buildContext(request);

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });
  });
});
