import { CreateAdminUserService } from "./auth/AdminUserService";
import { CreateAuthController } from "./auth/AuthController";
import { CreateAuthService } from "./auth/AuthService";
import { CreateInMemoryUserRepository } from "./auth/InMemoryUserRepository";
import { CreatePasswordHasher } from "./auth/PasswordHasher";
import { CreateApp } from "./app";
import type { IApp } from "./contracts";
import { CreateLoggingService } from "./service/LoggingService";
import type { ILoggingService } from "./service/LoggingService";
import { CreateEventController } from "./event/EventController";
import { CreateEventService } from "./event/EventService";
import { CreateInMemoryEventRepository } from "./event/EventRepository";
import { CreateEventListController } from "./event/EventListController";
import { CreateDashboardController } from "./dashboard/DashboardController";
import { CreateDashboardService } from "./dashboard/DashboardService";
import { CreateRSVPController } from "./rsvp/RSVPController";
import { CreateRSVPService } from "./rsvp/RSVPService";
import { CreateRSVPRepository } from "./rsvp/RSVPRepository";
import { CreatePrismaEventRepository } from "./event/PrismaEventRepository";
import { CreateAttendeeService } from "./attendee/AttendeeService";
import { CreateAttendeeController } from "./attendee/AttendeeController";
import { CreateOrganizerService } from "./organizerdashboard/OrganizerService";
import { CreateOrganizerController } from "./organizerdashboard/OrganizerDashboard";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

export function createComposedApp(mode: "prisma" | "memory", logger?: ILoggingService): IApp {
  const resolvedLogger = logger ?? CreateLoggingService();

  // Authentication & authorization wiring
  const authUsers = CreateInMemoryUserRepository();
  const passwordHasher = CreatePasswordHasher();
  const authService = CreateAuthService(authUsers, passwordHasher);
  const adminUserService = CreateAdminUserService(authUsers, passwordHasher);
  const authController = CreateAuthController(authService, adminUserService, resolvedLogger);


  // RSVP wiring
  const rsvpRepository = CreateRSVPRepository();
  const rsvpService = CreateRSVPService(rsvpRepository);
  const rsvpController = CreateRSVPController(rsvpService, resolvedLogger); 
  
  // Event wiring
  const eventRepository = 
    mode === "prisma" 
      ? CreatePrismaEventRepository(
          new PrismaClient({
            adapter: new PrismaBetterSqlite3({
              url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
            }),
          }),
      ) : CreateInMemoryEventRepository();
  const eventService = CreateEventService(eventRepository);
  const eventController = CreateEventController(eventService, resolvedLogger, rsvpRepository);
  const eventListController = CreateEventListController(eventService, resolvedLogger);

  // Dashboard wiring
  const dashboardService = CreateDashboardService(rsvpRepository, eventRepository);
  const dashboardController = CreateDashboardController(dashboardService, resolvedLogger);

  // Attendee wiring
  const attendeeService = CreateAttendeeService(eventRepository, rsvpRepository);
  const attendeeController = CreateAttendeeController(attendeeService, resolvedLogger);

  // Organizer wiring
  const organizerService = CreateOrganizerService(eventRepository, rsvpRepository);
  const organizerController = CreateOrganizerController(eventService, organizerService, resolvedLogger);

  return CreateApp(eventController, eventListController, authController, organizerController, resolvedLogger, rsvpController, dashboardController, attendeeController);
}
