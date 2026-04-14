import { Request, Response } from "express";
import { EventService, type EventDetailError } from "./EventService";
import { getAuthenticatedUser } from "../session/AppSession";
import type { Event } from "./Event";

const eventService = new EventService();

export async function showEvent(req: Request, res: Response) {
  const eventId = req.params.id as string;
  const user = getAuthenticatedUser(req.session);

  const result = eventService.getEventDetail(
    eventId,
    user?.userId,
    user?.role,
  );

  if (result.ok === false) {
    const error: EventDetailError = result.value;

    if (error.name === "EventNotFound") {
      return res.status(404).send(error.message);
    }

    if (error.name === "Forbidden") {
      return res.status(403).send(error.message);
    }

    return res.status(400).send("Unknown error.");
  }

  const event: Event = result.value;

  return res.render("eventDetail", {
    event,
  });
}