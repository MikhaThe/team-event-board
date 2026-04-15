import { Request, Response } from "express";
import { Result } from "../lib/result";
import { IEventService, type EventDetailError } from "./EventService";
import { getAuthenticatedUser } from "../session/AppSession";
import type { Event } from "./Event";
import { ILoggingService } from "../service/LoggingService";

export interface IEventController {
  showEvent(req: Request, res: Response): Promise<void>;
  showEditEvent(req: Request, res: Response): Promise<void>;
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
      const error: EventDetailError = result.value;

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

    res.render("eventDetail", {
      event,
    });
  }

   async showEditEvent(req: Request, res: Response): Promise<void> {
    const eventId = req.params.id as string;
    const user = getAuthenticatedUser(req.session);

    const result = await this.service.saveEditEventDetails(
      eventId,
      user?.userId,
      user?.role,
    );

    if (result.ok === false) {
      const error: EventDetailError = result.value;

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

    res.render("editEvent", {
      eventId,
    });
  }
}

export function createEventController(service: IEventService, logger: ILoggingService): IEventController {
  return new EventController(service, logger);
}
