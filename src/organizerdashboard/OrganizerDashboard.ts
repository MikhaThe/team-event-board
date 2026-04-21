import type { Response } from "express";
import type { IEventService } from "../event/EventService";
import type { IOrganizerService } from "./OrganizerService";
import type { ILoggingService } from "../service/LoggingService";
import type { IAppBrowserSession } from "../session/AppSession";
import type { IOrganizerDashboard } from "./OrganizerEvents";

export interface IEventController {
  showOrganizerDashboard(
    res: Response,
    organizerId: string,
    session: IAppBrowserSession,
    pageError?: string | null,
  ): Promise<void>;
  publishEventFromForm(
    res: Response,
    eventId: string,
    organizerId: string,
    session: IAppBrowserSession,
  ): Promise<void>;
  cancelEventFromForm(
    res: Response,
    eventId: string,
    organizerId: string,
    session: IAppBrowserSession,
  ): Promise<void>;
}

class OrganizerController implements IEventController {
  constructor(
    private readonly eventService: IEventService,
    private readonly organizerService: IOrganizerService,
    private readonly logger: ILoggingService,
  ) {}

  private mapErrorStatus(errorName: string): number {
    if (errorName === "EventNotFound") return 404;
    if (errorName === "Forbidden") return 403;
    if (errorName === "InvalidTransition") return 409;
    return 500;
  }

  private async renderDashboard(
    res: Response,
    organizerId: string,
    session: IAppBrowserSession,
    pageError: string | null = null,
  ): Promise<void> {
    const result = await this.organizerService.getOrganizerDashboard(organizerId);

    if (!result.ok) {
      res.status(500).render("events/organizer-dashboard", {
        session,
        pageError: pageError ?? result.value,
        dashboard: { draft: [], published: [], cancelled: [], past: [] } as IOrganizerDashboard,
      });
      return;
    }

    res.render("events/organizer-dashboard", {
      session,
      pageError,
      dashboard: result.value,
    });
  }

  async showOrganizerDashboard(
    res: Response,
    organizerId: string,
    session: IAppBrowserSession,
    pageError: string | null = null,
  ): Promise<void> {
    await this.renderDashboard(res, organizerId, session, pageError);
  }

  async publishEventFromForm(
    res: Response,
    eventId: string,
    organizerId: string,
    session: IAppBrowserSession,
  ): Promise<void> {
    const result = await this.eventService.publishEvent(eventId, organizerId);

    if (!result.ok) {
      const status = this.mapErrorStatus(result.value.name);
      const log = status >= 500 ? this.logger.error : this.logger.warn;
      log.call(this.logger, `Publish event failed: ${result.value.message}`);
      res.status(status);
      await this.renderDashboard(res, organizerId, session, result.value.message);
      return;
    }

    this.logger.info(`Published event ${result.value.id} by organizer ${organizerId}`);
    res.redirect("/organizer/dashboard");
  }

  async cancelEventFromForm(
    res: Response,
    eventId: string,
    organizerId: string,
    session: IAppBrowserSession,
  ): Promise<void> {
    const result = await this.eventService.cancelEvent(eventId, organizerId);

    if (!result.ok) {
      const status = this.mapErrorStatus(result.value.name);
      const log = status >= 500 ? this.logger.error : this.logger.warn;
      log.call(this.logger, `Cancel event failed: ${result.value.message}`);
      res.status(status);
      await this.renderDashboard(res, organizerId, session, result.value.message);
      return;
    }

    this.logger.info(`Cancelled event ${result.value.id} by organizer ${organizerId}`);
    res.redirect("/organizer/dashboard");
  }
}

export function CreateOrganizerController(
  eventService: IEventService,
  organizerService: IOrganizerService,
  logger: ILoggingService,
): IEventController {
  return new OrganizerController(eventService, organizerService, logger);
}
