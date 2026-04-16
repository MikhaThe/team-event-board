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
import { InMemoryEventRepository } from "./event/EventRepository";
import { CreateEventListController } from "./event/EventListController";
import { CreateDashboardController } from "./dashboard/DashboardController";
import { CreateDashboardService } from "./dashboard/DashboardService";
import { CreateRSVPController } from "./rsvp/RSVPController";
import { CreateRSVPService } from "./rsvp/RSVPService";
import { CreateRSVPRepository } from "./rsvp/RSVPRepository";

export function createComposedApp(logger?: ILoggingService): IApp {
  const resolvedLogger = logger ?? CreateLoggingService();

  // Authentication & authorization wiring
  const authUsers = CreateInMemoryUserRepository();
  const passwordHasher = CreatePasswordHasher();
  const authService = CreateAuthService(authUsers, passwordHasher);
  const adminUserService = CreateAdminUserService(authUsers, passwordHasher);
  const authController = CreateAuthController(authService, adminUserService, resolvedLogger);

  // Event wiring (Feature 2 / Feature 6)
  const eventRepository = InMemoryEventRepository();
  const eventService = CreateEventService(eventRepository);
  const eventController = CreateEventController(eventService, resolvedLogger);
  const eventListController = CreateEventListController(eventService, resolvedLogger);
  const rsvpRepository = CreateRSVPRepository();
  const rsvpService = CreateRSVPService(rsvpRepository);
  const rsvpController = CreateRSVPController(rsvpService, resolvedLogger);
  const dashboardService = CreateDashboardService(rsvpRepository, eventRepository);
  const dashboardController = CreateDashboardController(dashboardService, resolvedLogger);

  return CreateApp(eventController, eventListController, authController, resolvedLogger, rsvpController, dashboardController);
}
