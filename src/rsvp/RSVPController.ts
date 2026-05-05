import type { Request, Response } from "express";
import type { IRSVPService } from "./RSVPService";
import type { ILoggingService } from "../service/LoggingService";
import {
  getAuthenticatedUser,
  type IAppBrowserSession,
} from "../session/AppSession";
import { RSVPError } from "../lib/error";

export interface IRSVPController {
  toggleRSVPFromForm(
    req: Request,
    res: Response,
    eventId: String,
    session: IAppBrowserSession,
  ): Promise<void>;
}

export class RSVPController implements IRSVPController {
  constructor(
    private readonly service: IRSVPService,
    private readonly logger: ILoggingService,
  ) {}

  private isHtmxRequest(req: Request): boolean {
      return req.get("HX-Request") === "true";
  }

  private mapErrorStatus(error: RSVPError): number {
    if (error.name === "Invalid RSVP") return 400;
    if (error.name === "RSVP Not Found") return 404
    return 500;
  }

  async toggleRSVPFromForm(
    req: Request,
    res: Response,
    eventId: String,
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
      eventId: eventId,
    });

    if (result.ok === false) {
      const error = result.value;
      const status = this.mapErrorStatus(error);
      const log = status >= 500 ? this.logger.error : this.logger.warn;

      log.call(this.logger, `RSVP toggle failed: ${error.message}`);
      res.status(status);

      // Assuming event page route pattern
      res.redirect(`/events/${eventId}?error=${encodeURIComponent(error.message)}`);
      return;
    }


    const { rsvp, capacity, attendeeCount } = result.value;

    this.logger.info(
      `RSVP updated: user=${user.userId} event=${rsvp.eventId} status=${rsvp.status}`,
    );

    if (this.isHtmxRequest(req)) {
      res.status(200).render("partials/rsvpButton", {
        eventId: rsvp.eventId,
        capacity: capacity ?? 0,
        attendeeCount: attendeeCount ?? 0,
        rsvpStatus: rsvp.status,
        error: null,
        layout: false,
      });
      return;
    }
    
    // Redirect back to event page (typical UX)
    res.redirect(`/events/${rsvp.eventId}`);
  }
}

export function CreateRSVPController(service: IRSVPService, logger: ILoggingService): IRSVPController {
  return new RSVPController(service, logger);
}