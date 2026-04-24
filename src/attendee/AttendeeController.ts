import type { Request, Response } from "express";
import type { IAttendeeService, AttendeeError } from "./AttendeeService";
import type { ILoggingService } from "../service/LoggingService";
import { touchAppSession, type AppSessionStore } from "../session/AppSession";

export interface IAttendeeController {
  getAttendeeList(req: Request, res: Response): Promise<void>;
}

class AttendeeController implements IAttendeeController {
  constructor(
    private readonly service: IAttendeeService,
    private readonly logger: ILoggingService,
  ) {}

  async getAttendeeList(req: Request, res: Response): Promise<void> {
    const isHtmx = req.headers['hx-request'] === 'true';
    const session = touchAppSession(req.session as AppSessionStore);
    const user = session.authenticatedUser;

    if (!user) {
      res.status(403).render("partials/error", {
        message: "You must be logged in to view this page.",
        layout: false,
      });
      return;
    }

    const eventId = String(req.params.id);

    // Pass a resolver function so the service never touches the session
    const getUserDisplayName = (userId: string): string => {
      // In Sprints 1-2 we resolve against the session user only;
      // Sprint 3 will replace this with a real DB lookup
      if (userId === user.userId) return user.displayName;
      return "Unknown User";
    };

    const result = await this.service.getAttendeeList(
      eventId,
      user.userId,
      user.role,
      getUserDisplayName,
    );

    if (!result.ok) {
      const error = result.value as AttendeeError;
      const status = error.name === "EventNotFound" ? 404 : 403;
      this.logger.warn(`AttendeeList failed: ${error.message}`);
      res.status(status).render("partials/error", {
        message: error.message,
        layout: false,
      });
      return;
    }

    res.render("attendeeList", {
      session,
      ...result.value,
      layout: isHtmx ? false : undefined,
    });
  }
}

export function CreateAttendeeController(
  service: IAttendeeService,
  logger: ILoggingService,
): IAttendeeController {
  return new AttendeeController(service, logger);
}
