import { Request, Response } from "express";
import type { IEventService, EventDetailError } from "./EventService";
import {
  getAuthenticatedUser,
  touchAppSession,
  type AppSessionStore,
} from "../session/AppSession";
import type { Event } from "./Event";
import { ILoggingService } from "../service/LoggingService";


export interface IEventController {
  showEvent(req: Request, res: Response): Promise<void>;
  showEditEvent(req: Request, res: Response): Promise<void>;
  updateEvent(req: Request, res: Response): Promise<void>;
  searchEvents(req: Request, res: Response): Promise<void>;
}

class EventController implements IEventController {
  constructor(
    private readonly service: IEventService,
    private readonly logger: ILoggingService
  ) {}

  async showEvent(req: Request, res: Response): Promise<void> {
    const eventId = req.params.id as string;
    const user = getAuthenticatedUser(req.session);

    const result = await this.service.getEventDetail(
      eventId,
      user?.userId,
      user?.role,
    );

    if (result.ok === false) {
      const error = result.value as EventDetailError;

      if (error.name === "EventNotFound") {
        res.status(404).send(error.message);
        return;
      }

      if (error.name === "Forbidden") {
        res.status(403).send(error.message);
        return;
      }

      res.status(400).send("Unknown error.");
      return;
    }

    const event: Event = result.value;
    const browserSession = touchAppSession(req.session as AppSessionStore);

    res.render("eventDetail", {
      event,
      session: browserSession,
    });
  }

  async showEditEvent(req: Request, res: Response): Promise<void> {
    const eventId = req.params.id as string;
    const user = getAuthenticatedUser(req.session);

    const result = await this.service.getEventDetail(
      eventId,
      user?.userId,
      user?.role,
    );

    if (!result.ok) {
      const error = result.value as EventDetailError;

      if (error.name === "EventNotFound") {
        res.status(404).send(error.message);
        return;
      }

      if (error.name === "Forbidden") {
        res.status(403).send(error.message);
        return;
      }

      res.status(400).send("Unknown error.");
      return;
    }

    const browserSession = touchAppSession(req.session as AppSessionStore);

    res.render("partials/editEvent", {
      event: result.value,
      session: browserSession,
      layout: false,
    });
  }

  async updateEvent(req: Request, res: Response): Promise<void> {
    const eventId = req.params.id as string;
    const user = getAuthenticatedUser(req.session);

    const updates = req.body;

    const result = await this.service.editEvent(
      eventId,
      updates,
      user?.userId,
      user?.role
    );

    if (!result.ok) {
      const error = result.value as EventDetailError;

      if (error.name === "EventNotFound") {
        res.status(404).send(error.message);
        return;
      }

      if (error.name === "Forbidden") {
        res.status(403).send(error.message);
        return;
      }

      res.status(400).send("Unknown error.");
      return;
    }

    const eventResult = await this.service.getEventDetail(
      eventId,
      user?.userId,
      user?.role,
    );

    if (!eventResult.ok) {
      const error = eventResult.value as EventDetailError;

      if (error.name === "EventNotFound") {
        res.status(404).send(error.message);
        return;
      }

      if (error.name === "Forbidden") {
        res.status(403).send(error.message);
        return;
      }

      res.status(400).send("Unknown error.");
      return;
    }


    res.render("eventDetail", {
      event: eventResult.value,
      layout: false,
    })
  }
  
  async searchEvents(req: Request, res: Response): Promise<void> {
    const termRaw = req.query.q;
    const term = Array.isArray(termRaw) ? termRaw[0] : termRaw;

    const result = await this.service.searchEvents(String(term));

    if (!result.ok) {
      const error = result.value as EventDetailError;
      
      if (error.name === "EventNotFound") {
        res.status(404).send(error.message);
        return;
      }

      if (error.name === "Forbidden") {
        res.status(403).send(error.message);
        return;
      }

      res.status(400).send("Unknown error.");
      return;
    }
    return;
  }
}

export function CreateEventController(
  service: IEventService,
  logger: ILoggingService
): IEventController {
  return new EventController(service, logger);
}
