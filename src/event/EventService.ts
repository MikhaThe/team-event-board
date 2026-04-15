import { Err, Ok, type Result } from "../lib/result"
import type { Event } from "./Event"
import type { IEventRepository } from "./EventRepository"
import { InMemoryEventRepository } from "./EventRepository"

export type EventDetailError =
  | { name: "EventNotFound"; message: string }
  | { name: "Forbidden"; message: string }

export class EventService {
  constructor(
    private readonly eventRepository: IEventRepository = InMemoryEventRepository(),
  ) {}

  async getEventDetail(
    eventId: string,
    viewerId?: string,
    viewerRole?: string,
  ): Promise<Result<Event, EventDetailError>> {
    const result = await this.eventRepository.findById(eventId)

    if (!result.ok) {
      return Err({
        name: "EventNotFound" as const,
        message: "Event not found.",
      })
    }

    const event = result.value

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

  async getFilteredEvents(
    category?: string,
    date?: string,
  ): Promise<Result<Event[], string>> {
    const result = await this.eventRepository.findAll()

    if (!result.ok) {
      return Err("Unable to retrieve events.")
    }

    let events = result.value

    events = events.filter((event) => event.status === "published")

    if (category) {
      events = events.filter(
        (event) => event.category.toLowerCase() === category.toLowerCase(),
      )
    }

    if (date) {
      events = events.filter((event) => event.startDatetime.startsWith(date))
    }

    return Ok(events)
  }
}