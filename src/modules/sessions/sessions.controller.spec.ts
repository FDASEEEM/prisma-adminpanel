import { Test, TestingModule } from "@nestjs/testing";
import { AdminAuditAction } from "@prisma/client";
import { SessionsController } from "./sessions.controller";
import { SessionsService } from "./sessions.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { AdminAuthGuard } from "../../auth/guards/admin-auth.guard";

const mockSessionsService = () => ({
  listActive: jest.fn(),
  listHistorical: jest.fn(),
  listBlocked: jest.fn(),
  listByUser: jest.fn(),
  create: jest.fn(),
  block: jest.fn(),
  unblock: jest.fn(),
  terminate: jest.fn(),
  cleanupExpired: jest.fn(),
});

const mockAuditLogsService = () => ({ create: jest.fn() });

describe("SessionsController", () => {
  let controller: SessionsController;
  let service: ReturnType<typeof mockSessionsService>;
  let auditLogs: ReturnType<typeof mockAuditLogsService>;
  const request: any = { adminUser: { id: "u1", email: "u@u.com", nombreCompleto: "User" } };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SessionsController],
      providers: [
        { provide: SessionsService, useFactory: mockSessionsService },
        { provide: AuditLogsService, useFactory: mockAuditLogsService },
      ],
    })
      .overrideGuard(AdminAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<SessionsController>(SessionsController);
    service = module.get(SessionsService) as any;
    auditLogs = module.get(AuditLogsService) as any;
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("listActive", () => {
    it("should delegate to service", () => {
      service.listActive.mockReturnValue([{ id: "s1" }]);
      expect(controller.listActive()).toEqual([{ id: "s1" }]);
      expect(service.listActive).toHaveBeenCalled();
    });
  });

  describe("listHistorical", () => {
    it("should delegate to service", () => {
      service.listHistorical.mockReturnValue([{ id: "s1" }]);
      expect(controller.listHistorical()).toEqual([{ id: "s1" }]);
      expect(service.listHistorical).toHaveBeenCalled();
    });
  });

  describe("listBlocked", () => {
    it("should delegate to service", () => {
      service.listBlocked.mockReturnValue([{ id: "s1" }]);
      expect(controller.listBlocked()).toEqual([{ id: "s1" }]);
      expect(service.listBlocked).toHaveBeenCalled();
    });
  });

  describe("listByUser", () => {
    it("should delegate to service", () => {
      service.listByUser.mockReturnValue([{ id: "s1" }]);
      expect(controller.listByUser("u1")).toEqual([{ id: "s1" }]);
      expect(service.listByUser).toHaveBeenCalledWith("u1");
    });
  });

  describe("create", () => {
    it("should delegate to service", () => {
      const dto = { userId: "u1" } as any;
      service.create.mockReturnValue({ id: "s1" });
      expect(controller.create(dto)).toEqual({ id: "s1" });
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe("block", () => {
    it("should block session and log audit when adminUser present", async () => {
      const session = { id: "s1", userId: "u2" };
      service.block.mockResolvedValue(session);

      const result = await controller.block("s1", request);

      expect(service.block).toHaveBeenCalledWith("s1");
      expect(auditLogs.create).toHaveBeenCalledWith(
        { id: "u1", email: "u@u.com", name: "User" },
        AdminAuditAction.session_block,
        "AdminSession",
        "s1",
        { userId: "u2" },
      );
      expect(result).toEqual(session);
    });

    it("should not log audit when no adminUser", async () => {
      const session = { id: "s1", userId: "u2" };
      service.block.mockResolvedValue(session);

      await controller.block("s1", {} as any);

      expect(auditLogs.create).not.toHaveBeenCalled();
    });
  });

  describe("unblock", () => {
    it("should unblock session and log audit", async () => {
      const session = { id: "s1", userId: "u2" };
      service.unblock.mockResolvedValue(session);

      const result = await controller.unblock("s1", request);

      expect(service.unblock).toHaveBeenCalledWith("s1");
      expect(auditLogs.create).toHaveBeenCalledWith(
        { id: "u1", email: "u@u.com", name: "User" },
        AdminAuditAction.session_unblock,
        "AdminSession",
        "s1",
        { userId: "u2" },
      );
      expect(result).toEqual(session);
    });
  });

  describe("terminate", () => {
    it("should terminate session and log audit", async () => {
      const session = { id: "s1", userId: "u2" };
      service.terminate.mockResolvedValue(session);

      const result = await controller.terminate("s1", request);

      expect(service.terminate).toHaveBeenCalledWith("s1");
      expect(auditLogs.create).toHaveBeenCalledWith(
        { id: "u1", email: "u@u.com", name: "User" },
        AdminAuditAction.session_terminate,
        "AdminSession",
        "s1",
        { userId: "u2" },
      );
      expect(result).toEqual(session);
    });
  });

  describe("cleanupExpired", () => {
    it("should delegate to service", () => {
      service.cleanupExpired.mockReturnValue({ count: 2 });
      expect(controller.cleanupExpired()).toEqual({ count: 2 });
      expect(service.cleanupExpired).toHaveBeenCalled();
    });
  });
});
