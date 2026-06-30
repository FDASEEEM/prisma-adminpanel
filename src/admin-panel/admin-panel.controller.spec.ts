import { Test, TestingModule } from "@nestjs/testing";
import { AdminPanelController } from "./admin-panel.controller";
import { AdminPanelService } from "./admin-panel.service";
import { AuditLogsService } from "../modules/audit-logs/audit-logs.service";
import { AdminAuthGuard } from "../auth/guards/admin-auth.guard";

const mockAdminPanelService = () => ({
  getDashboardSummary: jest.fn(),
});

const mockAuditLogsService = () => ({
  create: jest.fn(),
});

describe("AdminPanelController", () => {
  let controller: AdminPanelController;
  let adminPanelService: ReturnType<typeof mockAdminPanelService>;
  let auditLogsService: ReturnType<typeof mockAuditLogsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminPanelController],
      providers: [
        { provide: AdminPanelService, useFactory: mockAdminPanelService },
        { provide: AuditLogsService, useFactory: mockAuditLogsService },
      ],
    })
      .overrideGuard(AdminAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AdminPanelController>(AdminPanelController);
    adminPanelService = module.get(AdminPanelService) as any;
    auditLogsService = module.get(AuditLogsService) as any;
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("dashboardSummary", () => {
    it("should log audit and delegate to service when adminUser present", async () => {
      const expected = { kpis: {} };
      adminPanelService.getDashboardSummary.mockResolvedValue(expected);
      const request: any = { adminUser: { id: "a1", email: "a@a.com" }, ip: "1.2.3.4", socket: { remoteAddress: "1.2.3.4" } };

      const result = await controller.dashboardSummary(request);

      expect(auditLogsService.create).toHaveBeenCalledWith(request.adminUser, "dashboard_view", "dashboard", undefined, { ipAddress: "1.2.3.4" });
      expect(adminPanelService.getDashboardSummary).toHaveBeenCalledWith("a1");
      expect(result).toEqual(expected);
    });

    it("should not log audit when no adminUser", async () => {
      const expected = { kpis: {} };
      adminPanelService.getDashboardSummary.mockResolvedValue(expected);
      const request: any = { ip: "1.2.3.4", socket: { remoteAddress: "1.2.3.4" } };

      const result = await controller.dashboardSummary(request);

      expect(auditLogsService.create).not.toHaveBeenCalled();
      expect(adminPanelService.getDashboardSummary).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(expected);
    });
  });

  describe("me", () => {
    it("should return adminUser from request", () => {
      const request: any = { adminUser: { id: "a1", email: "a@a.com" } };
      expect(controller.me(request)).toEqual(request.adminUser);
    });
  });
});
