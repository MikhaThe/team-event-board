import { Err, Ok, type Result } from "../lib/result"
import type { Event } from "./Event"
import type { IEventRepository } from "./EventRepository"
import { InMemoryEventRepository } from "./EventRepository"

export type EventDetailError =
  | { name: "EventNotFound"; message: string }
  | { name: "Forbidden"; message: string }
  | { name: "InvalidInput"; message: string }

export type EditEventInput = {
  title?: string
  description?: string
  location?: string
  category?: string
  startDatetime?: string
  endDatetime?: string
}

export type CreateEventInput = {
  title: string;
  description: string;
  location: string;
  category: string;
  startDatetime: string;
  endDatetime: string;
  capacity?: number;
  organizerId: string;
  organizerName: string;
}

export interface IEventService {
  getEventDetail(
    eventId: string,
    viewerId?: string,
    viewerRole?: string,
  ): Promise<Result<Event, EventDetailError>>

  getFilteredEvents(
    category?: string,
    date?: string,
  ): Promise<Result<Event[], string>>

  editEvent(
    eventId: string,
    updates: EditEventInput,
    viewerId?: string,
    viewerRole?: string
  ): Promise<Result<void, EventDetailError>>;
  saveEvent(event: Event): Promise<Result<void, EventDetailError>>;
  searchEvents(input: string | null,): Promise<Result<Event[], EventDetailError>>;
  createEvent(input: CreateEventInput): Promise<Result<Event, EventDetailError>>;
}

export class EventService implements IEventService {
  constructor(
    private readonly eventRepository: IEventRepository = InMemoryEventRepository(),
  ) {}

  async getEventDetail(eventId: string, viewerId?: string, viewerRole?: string): Promise<Result<Event, EventDetailError>> {
    const eventResult = await this.eventRepository.findById(eventId)

    if (!eventResult.ok) {
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

  async editEvent(
    eventId: string,
    updates: EditEventInput,
    viewerId?: string,
    viewerRole?: string,
  ): Promise<Result<void, EventDetailError>> {
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

    if (!isOwner && !isAdmin) {
      return Err({
        name: "Forbidden" as const,
        message: "You are not allowed to edit this event.",
      })
    }

    const updatedEvent: Event = {
      ...event,
      ...updates,
    }

    const saveResult = await this.eventRepository.save(updatedEvent)

    if (!saveResult.ok) {
      return Err({
        name: "Forbidden" as const,
        message: "Unable to update event.",
      })
    }

    return Ok(undefined);
  }

  async saveEvent(event: Event): Promise<Result<void, EventDetailError>> {
    const saveResult = await this.eventRepository.save(event)
    if (saveResult.ok === false) {
      return Err({
          name: "EventNotFound" as const,
          message: "Event not found.",
        })
    }
    return Ok(undefined)
  }

  async searchEvents(input: string | null): Promise<Result<Event[], EventDetailError>> {
    const term = input ?? "";
    const normalized = term.trim().toLowerCase();
    const now = new Date();

    if (!term.trim()) {
      const result = await this.eventRepository.listPublishedUpcoming(now);
      if (!result.ok) {
        return Err({
          name: "EventNotFound" as const,
          message: "Event not found.",
        })
      }
      return Ok(result.value);
    }

    const result = await this.eventRepository.searchPublishedUpcoming(normalized, now);
    if (result.ok === false) {
      return Err({
        name: "EventNotFound" as const,
        message: "Event not found.",
      })
    }
    return Ok(result.value);
  }

  async createEvent(input: CreateEventInput): Promise<Result<Event, EventDetailError>> {
    const { title, description, location, category,
            startDatetime, endDatetime, capacity,
            organizerId, organizerName } = input;

    if (!title?.trim())
      return Err({ name: "InvalidInput" as const, message: "Title is required." });

    if (!location?.trim())
      return Err({ name: "InvalidInput" as const, message: "Location is required." });

    if (!category?.trim())
      return Err({ name: "InvalidInput" as const, message: "Category is required." });

    if (!startDatetime || !endDatetime)
      return Err({ name: "InvalidInput" as const, message: "Start and end times are required." });

    if (new Date(endDatetime) <= new Date(startDatetime))
      return Err({ name: "InvalidInput" as const, message: "End time must be after start time." });

    if (capacity !== undefined && capacity !== null && capacity < 1)
      return Err({ name: "InvalidInput" as const, message: "Capacity must be at least 1." });

    const result = await this.eventRepository.create({
      title: title.trim(),
      description: description?.trim() ?? "",
      location: location.trim(),
      category: category.trim(),
      status: "draft",
      organizerId,
      organizerName,
      startDatetime,
      endDatetime,
      capacity: capacity ? Number(capacity) : undefined,
    });

    if (!result.ok)
      return Err({ name: "EventNotFound" as const, message: result.value as string });

    return Ok(result.value);
  }
}

export function CreateEventService(
  eventRepository: IEventRepository = InMemoryEventRepository(),
): IEventService {
  return new EventService(eventRepository)
}