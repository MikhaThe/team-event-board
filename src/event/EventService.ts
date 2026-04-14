import { Err, Ok, type Result } from "../lib/result"
import { findById } from "./EventRepository"
import type { Event } from "./Event"

export type EventDetailError =
  | { name: "EventNotFound"; message: string }
  | { name: "Forbidden"; message: string }
export class EventService {
  getEventDetail(
    eventId: string,
    viewerId?: string,
    viewerRole?: string,
  ): Result<Event, EventDetailError> {
    const event = findById(eventId)

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

    return Ok(event)
  }
}