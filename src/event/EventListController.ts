import { Request, Response } from "express";
import { EventService } from "./EventService";
import {
  touchAppSession,
  type AppSessionStore,
} from "../session/AppSession";

const eventService = new EventService();

export async function listEvents(req: Request, res: Response): Promise<void> {
  const category =
    typeof req.query.category === "string" ? req.query.category : undefined;

  const date =
    typeof req.query.date === "string" ? req.query.date : undefined;

  const result = await eventService.getFilteredEvents(category, date);

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
  });
}