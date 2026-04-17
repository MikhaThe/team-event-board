import type { Response } from "express";
import type { IRSVPService } from "./RSVPService";
import type { ILoggingService } from "../service/LoggingService";
import {
  getAuthenticatedUser,
  type IAppBrowserSession,
} from "../session/AppSession";
import type { AuthError } from "../auth/errors";
import { create } from "node:domain";

export interface IRSVPController {
  toggleRSVPFromForm(
    res: Response,
    input: { eventId: string; capacity: number },
    session: IAppBrowserSession,
  ): Promise<void>;
}

export class RSVPController implements IRSVPController {
  constructor(
    private readonly service: IRSVPService,
    private readonly logger: ILoggingService,
  ) {}

  private mapErrorStatus(error: AuthError): number {
    if (error.name === "AuthorizationRequired") return 403;
    if (error.name === "ValidationError") return 400;
    return 500;
  }

  async toggleRSVPFromForm(
    res: Response,
    input: { eventId: string; capacity: number },
    session: IAppBrowserSession,
  ): Promise<void> {
    const user = session.authenticatedUser

    if (!user) {
      this.logger.warn("RSVP attempt without authentication");
      res.status(403).redirect("/login");
      return;
    }

    const result = await this.service.toggleRSVP({
      userId: user.userId,
      eventId: input.eventId,
      capacity: input.capacity,
    });

    if (result.ok === false) {
      const error = result.value;
      const status = this.mapErrorStatus(error);
      const log = status >= 500 ? this.logger.error : this.logger.warn;

      log.call(this.logger, `RSVP toggle failed: ${error.message}`);
      res.status(status);

      // Assuming event page route pattern
      res.redirect(`/events/${input.eventId}?error=${encodeURIComponent(error.message)}`);
      return;
    }

    const rsvp = result.value;

    this.logger.info(
      `RSVP updated: user=${user.userId} event=${rsvp.eventId} status=${rsvp.status}`,
    );

    // Redirect back to event page (typical UX)
    res.redirect(`/events/${rsvp.eventId}`);
  }
}

export function CreateRSVPController(service: IRSVPService, logger: ILoggingService): IRSVPController {
  return new RSVPController(service, logger);
}