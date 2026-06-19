import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../infrastructure/prisma/prisma.service";
import { AdminPanelService } from "./admin-panel.service";

const mockPrismaService = () => ({
  supportTicket: { count: jest.fn(), findMany: jest.fn() },
  announcement: { count: jest.fn() },
  resourceMaterial: { count: jest.fn() },
  professor: { count: jest.fn() },
  adminSession: { count: jest.fn() },
});

describe("AdminPanelService", () => {
  let service: AdminPanelService;
  let prisma: ReturnType<typeof mockPrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminPanelService, { provide: PrismaService, useFactory: mockPrismaService }],
    }).compile();

    service = module.get<AdminPanelService>(AdminPanelService);
    prisma = module.get(PrismaService) as any;
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getDashboardSummary", () => {
    it("should aggregate kpis and recent tickets", async () => {
      prisma.supportTicket.count.mockResolvedValue(2);
      prisma.announcement.count.mockResolvedValue(3);
      prisma.resourceMaterial.count.mockResolvedValue(4);
      prisma.professor.count.mockResolvedValue(5);
      prisma.adminSession.count.mockResolvedValue(6);
      const recentTickets = [{ id: "t1", subject: "S", status: "open", createdAt: new Date() }];
      prisma.supportTicket.findMany.mockResolvedValue(recentTickets);

      const result = await service.getDashboardSummary("admin1");

      expect(prisma.supportTicket.count).toHaveBeenCalledWith({ where: { status: "open" } });
      expect(prisma.announcement.count).toHaveBeenCalledWith({ where: { isActive: true } });
      expect(prisma.resourceMaterial.count).toHaveBeenCalledWith();
      expect(prisma.professor.count).toHaveBeenCalledWith({ where: { isActive: true } });
      expect(prisma.adminSession.count).toHaveBeenCalledWith({ where: { isActive: true, isBlocked: false } });
      expect(prisma.supportTicket.findMany).toHaveBeenCalledWith({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { id: true, subject: true, status: true, createdAt: true },
      });
      expect(result).toEqual({
        actorId: "admin1",
        kpis: { openTickets: 2, publishedAnnouncements: 3, totalResources: 4, activeProfessors: 5, activeSessions: 6 },
        recentTickets,
      });
    });

    it("should work without actorId", async () => {
      prisma.supportTicket.count.mockResolvedValue(0);
      prisma.announcement.count.mockResolvedValue(0);
      prisma.resourceMaterial.count.mockResolvedValue(0);
      prisma.professor.count.mockResolvedValue(0);
      prisma.adminSession.count.mockResolvedValue(0);
      prisma.supportTicket.findMany.mockResolvedValue([]);

      const result = await service.getDashboardSummary();

      expect(result.actorId).toBeUndefined();
    });
  });
});
