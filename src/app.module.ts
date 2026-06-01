import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AdminPanelModule } from "./admin-panel/admin-panel.module";
import { AuthModule } from "./auth/auth.module";
import { InfrastructureModule } from "./infrastructure/infrastructure.module";
import { TicketsModule } from "./modules/tickets/tickets.module";
import { ResourcesModule } from "./modules/resources/resources.module";
import { AnnouncementsModule } from "./modules/announcements/announcements.module";
import { AuditLogsModule } from "./modules/audit-logs/audit-logs.module";
import { ProfessorsModule } from "./modules/professors/professors.module";
import { SessionsModule } from "./modules/sessions/sessions.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    InfrastructureModule,
    AuthModule,
    AdminPanelModule,
    TicketsModule,
    ResourcesModule,
    AnnouncementsModule,
    AuditLogsModule,
    ProfessorsModule,
    SessionsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
