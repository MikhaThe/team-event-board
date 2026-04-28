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

export function createComposedApp(logger?: ILoggingService): IApp {
  const resolvedLogger = logger ?? CreateLoggingService();

  // Authentication & authorization wiring
  const authUsers = CreateInMemoryUserRepository();
  const passwordHasher = CreatePasswordHasher();
  const authService = CreateAuthService(authUsers, passwordHasher);
  const adminUserService = CreateAdminUserService(authUsers, passwordHasher);
  const authController = CreateAuthController(authService, adminUserService, resolvedLogger);

  // Event wiring
  const eventRepository = CreatePrismaEventRepository();
  const eventService = CreateEventService(eventRepository);
  const eventController = CreateEventController(eventService, resolvedLogger);
  const eventListController = CreateEventListController(eventService, resolvedLogger);

  // RSVP wiring
  const rsvpRepository = CreateRSVPRepository();
  const rsvpService = CreateRSVPService(rsvpRepository);
  const rsvpController = CreateRSVPController(rsvpService, resolvedLogger);

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
