import { Err, Ok, type Result } from "../lib/result"
import { IEventRepository } from "./EventRepository"
import type { Event } from "./Event"

export type EventDetailError =
  | { name: "EventNotFound"; message: string }
  | { name: "Forbidden"; message: string }

export interface IEventService {
  getEventDetail(
    eventId: string,
    viewerId?: string,
    viewerRole?: string,
  ): Promise<Result<Event, EventDetailError>>;
  saveEditEventDetails(
    eventId: string,
    viewerId?: string,
    viewerRole?: string
  ): Promise<Result<void, EventDetailError>>;
}

class EventService implements IEventService{

  constructor(private readonly repository: IEventRepository) {}

  async getEventDetail(
    eventId: string,
    viewerId?: string,
    viewerRole?: string,
  ): Promise<Result<Event, EventDetailError>> {
    const eventResult = await this.repository.findById(eventId)

    if (eventResult.ok === false) {
      return Err({
        name: "EventNotFound" as const,
        message: "Event not found.",
      })
    }

    const event = eventResult.value
    if (!event) {
      return Err({
        name: "EventNotFound" as const,
        message: "Event not found.",
      })
    }   

    const isOwner = viewerId === event.organizerId
    const isAdmin = viewerRole === "admin"

    if (event.status === "draft" && !isOwner && !isAdmin) {
      return Err({
        name: "Forbidden" as const,
        message: "You are not allowed to view this draft event.",
      })
    }

    return Ok(event);
  }

  async saveEditEventDetails(eventId: string,
    viewerId?: string,
    viewerRole?: string): Promise<Result<void, EventDetailError>> {
    const eventResult = await this.repository.findById(eventId)

    if (eventResult.ok === false) {
      return Err({
        name: "EventNotFound" as const,
        message: "Event not found.",
      })
    }

    const event = eventResult.value
    if (!event) {
      return Err({
        name: "EventNotFound" as const,
        message: "Event not found.",
      })
    }   
    const isOwner = viewerId === event.organizerId
    const isAdmin = viewerRole === "admin"

    if (event.status === "draft" && !isOwner && !isAdmin) {
      return Err({
        name: "Forbidden" as const,
        message: "You are not allowed to view this draft event.",
      })
    }

    return Ok(undefined);
  }
}

export function createEventService(repository: IEventRepository): IEventService {
  return new EventService(repository);
}