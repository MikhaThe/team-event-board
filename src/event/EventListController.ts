import { Request, Response } from "express";
import { IEventService } from "./EventService";
import {
  touchAppSession,
  type AppSessionStore,
} from "../session/AppSession";
import { ILoggingService } from "../service/LoggingService";

export interface IEventListController {
  listEvents(req: Request, res: Response): Promise<void>;
}

export class EventListController implements IEventListController {
  constructor(
    private eventService: IEventService,
    private logger: ILoggingService
  ) {}

  async listEvents(req: Request, res: Response): Promise<void> {
      const category =
        typeof req.query.category === "string" ? req.query.category : undefined;

    const date =
      typeof req.query.date === "string" ? req.query.date : undefined;

    const result = await this.eventService.getFilteredEvents(category, date);

    if (!result.ok) {
      res.status(500).send(result.value);
      return;
    }

    const browserSession = touchAppSession(req.session as AppSessionStore);

    res.render("eventList", {
      events: result.value,
      selectedCategory: category ?? "",
      selectedDate: date ?? "",
      session: browserSession,
      searchTerm: ""
    });
  }
}

export function CreateEventListController(
  eventService: IEventService,
  logger: ILoggingService
): IEventListController {
  return new EventListController(eventService, logger);
}