import { CreateAdminUserService } from "./auth/AdminUserService";
import { prisma } from "./lib/prismaClient";
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
import { CreateDashboardController } from "./dashboard/DashboardController";
import { CreateDashboardService } from "./dashboard/DashboardService";
import { CreateRSVPController } from "./rsvp/RSVPController";
import { CreateRSVPService } from "./rsvp/RSVPService";
import { CreatePrismaRSVPRepository } from "./rsvp/PrismaRSVPRepository";
import { CreateRSVPRepository } from "./rsvp/RSVPRepository";
import { CreatePrismaEventRepository } from "./event/PrismaEventRepository";
import { CreateAttendeeService } from "./attendee/AttendeeService";
import { CreateAttendeeController } from "./attendee/AttendeeController";
import { CreateOrganizerService } from "./organizerdashboard/OrganizerService";
import { CreateOrganizerController } from "./organizerdashboard/OrganizerDashboard";
import { CreateCommentService } from "./comment/CommentService";
import { CreateCommentController } from "./comment/CommentController";
import { CreateCommentRepository } from "./comment/CommentRepository";
import { CreatePrismaCommentRepository } from "./comment/PrismaCommentRepository";

export function createComposedApp(mode: "prisma" | "memory" = "prisma", logger?: ILoggingService): IApp {
  const resolvedLogger = logger ?? CreateLoggingService();

  // Authentication & authorization wiring
  const authUsers = CreateInMemoryUserRepository();
  const passwordHasher = CreatePasswordHasher();
  const authService = CreateAuthService(authUsers, passwordHasher);
  const adminUserService = CreateAdminUserService(authUsers, passwordHasher);
  const authController = CreateAuthController(authService, adminUserService, resolvedLogger);

  // RSVP, Event, and Comment repo wiring
  const eventRepository = mode === "prisma" ? CreatePrismaEventRepository(prisma) : CreateInMemoryEventRepository();
  const rsvpRepository = mode === "prisma" ? CreatePrismaRSVPRepository(prisma) : CreateRSVPRepository();
  const commentRepository = mode === "prisma" ? CreatePrismaCommentRepository(prisma) : CreateCommentRepository();

  // Event wiring
  const eventService = CreateEventService(eventRepository);
  const eventController = CreateEventController(eventService, resolvedLogger, rsvpRepository);

  // RSVP wiring
  const rsvpService = CreateRSVPService(rsvpRepository, eventRepository);
  const rsvpController = CreateRSVPController(rsvpService, resolvedLogger);

  // Dashboard wiring
  const dashboardService = CreateDashboardService(rsvpRepository, eventRepository);
  const dashboardController = CreateDashboardController(dashboardService, resolvedLogger);

  // Attendee wiring
  const attendeeService = CreateAttendeeService(eventRepository, rsvpRepository);
  const attendeeController = CreateAttendeeController(attendeeService, resolvedLogger, authUsers);

  // Organizer wiring
  const organizerService = CreateOrganizerService(eventRepository, rsvpRepository);
  const organizerController = CreateOrganizerController(eventService, organizerService, resolvedLogger);

  // Comment wiring
  const commentService = CreateCommentService(commentRepository, eventRepository, rsvpRepository);
  const commentController = CreateCommentController(commentService, resolvedLogger);

  return CreateApp(eventController, authController, organizerController, resolvedLogger, rsvpController, dashboardController, attendeeController, commentController);
}
