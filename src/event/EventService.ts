import { Err, Ok, type Result } from "../lib/result"
import type { Event } from "./Event"
import type { IEventRepository } from "./EventRepository"
import { type EventDetailError, EventNotFound, Forbidden, InvalidTransition, InvalidInput } from "../lib/error"

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
    viewerRole?: string,
  ): Promise<Result<Event, EventDetailError>>

  searchEvents(input: string | null): Promise<Result<Event[], EventDetailError>>
  publishEvent(eventId: string, organizerId: string, isAdmin?: boolean): Promise<Result<Event, EventDetailError>>
  cancelEvent(eventId: string, organizerId: string, isAdmin?: boolean): Promise<Result<Event, EventDetailError>>
  saveEvent(event: Event): Promise<Result<void, EventDetailError>>
  createEvent(input: CreateEventInput): Promise<Result<Event, EventDetailError>>
}

export class EventService implements IEventService {
  constructor(
    private readonly repository: IEventRepository,
  ) {}

  async getEventDetail(eventId: string, viewerId?: string, viewerRole?: string): Promise<Result<Event, EventDetailError>> {
    const result = await this.repository.findById(eventId)

    if (!result.ok) {
      return Err(EventNotFound("Event not found."))
    }

    const event = result.value

    if (!event) {
      return Err(EventNotFound("Event not found."))
    }

    const isOwner = viewerId === event.organizerId
    const isAdmin = viewerRole === "admin"

    if (event.status === "draft" && !isOwner && !isAdmin) {
      return Err(Forbidden("You are not allowed to view this draft event."))
    }

    return Ok(event)
  }

  async getFilteredEvents(
    category?: string,
    date?: string,
  ): Promise<Result<Event[], string>> {
    const result = await this.repository.findAll()

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
  ): Promise<Result<Event, EventDetailError>> {
    const result = await this.repository.findById(eventId)

    if (!result.ok) {
      return Err(EventNotFound("Event not found."))
    }

    const event = result.value

    if (!event) {
      return Err(EventNotFound("Event not found."))
    }

    const isOwner = viewerId === event.organizerId
    const isAdmin = viewerRole === "admin"

    if (!isOwner && !isAdmin) {
      return Err(Forbidden("You are not allowed to edit this event."))
    }

    const updatedEvent: Event = {
      ...event,
      ...updates,
    }

    const saveResult = await this.repository.save(updatedEvent)

    if (saveResult.ok === false) {
      return Err(Forbidden("Failed to save event."))
    }

    return Ok(updatedEvent)
  }

  async saveEvent(event: Event): Promise<Result<void, EventDetailError>> {
    const saveResult = await this.repository.save(event)
    if (saveResult.ok === false) {
      return Err(EventNotFound("Event not found."))
    }
    return Ok(undefined)
  }

  async searchEvents(input: string | null): Promise<Result<Event[], EventDetailError>> {
    const term = input ?? ""
    const normalized = term.trim().toLowerCase()
    const now = new Date()

    if (!term.trim()) {
      const result = await this.repository.listPublishedUpcoming(now)
      if (!result.ok) {
        return Err(EventNotFound("Event not found."))
      }
      return Ok(result.value)
    }

    const result = await this.repository.searchPublishedUpcoming(normalized, now)
    if (result.ok === false) {
      return Err(EventNotFound("Event not found."))
    }
    return Ok(result.value)
  }

  async createEvent(input: CreateEventInput): Promise<Result<Event, EventDetailError>> {
    const { title, description, location, category,
            startDatetime, endDatetime, capacity,
            organizerId, organizerName } = input

    if (!title?.trim())
      return Err(InvalidInput("Title is required."))

    if (!location?.trim())
      return Err(InvalidInput("Location is required."))

    if (!category?.trim())
      return Err(InvalidInput("Category is required."))

    if (!startDatetime || !endDatetime)
      return Err(InvalidInput("Start and end times are required."))

    if (new Date(endDatetime) <= new Date(startDatetime))
      return Err(InvalidInput("End time must be after start time."))

    if (capacity !== undefined && capacity !== null && capacity < 1)
      return Err(InvalidInput("Capacity must be at least 1."))

    const result = await this.repository.create({
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
    })

    if (!result.ok)
      return Err(EventNotFound("Failed to create event."))

    return Ok(result.value)
  }

  async publishEvent(eventId: string, organizerId: string, isAdmin = false): Promise<Result<Event, EventDetailError>> {
    const result = await this.repository.findById(eventId)
    if (!result.ok) { return Err(EventNotFound("Event not found.")) }

    const event = result.value
    if (!event) return Err(EventNotFound("Event not found."))
    if (!isAdmin && event.organizerId !== organizerId) return Err(Forbidden("Only the organizer can publish this event."))
    if (event.status !== "draft") return Err(InvalidTransition(`Cannot publish an event with status ${event.status}. Only draft events can be published.`))

    const updated: Event = { ...event, status: "published" }
    const updateResult = await this.repository.update(updated)
    if (!updateResult.ok) {
      return updateResult
    }
    return Ok(updateResult.value)
  }

  async cancelEvent(eventId: string, organizerId: string, isAdmin = false): Promise<Result<Event, EventDetailError>> {
    const result = await this.repository.findById(eventId)
    if (!result.ok) { return Err(EventNotFound("Event not found.")) }

    const event = result.value
    if (!event) return Err(EventNotFound("Event not found."))
    if (!isAdmin && event.organizerId !== organizerId) return Err(Forbidden("Only the organizer can cancel this event."))
    if (event.status !== "published") return Err(InvalidTransition(`Cannot cancel an event with status ${event.status}. Only published events can be cancelled.`))

    const updated: Event = { ...event, status: "cancelled" }
    const updateResult = await this.repository.update(updated)
    if (!updateResult.ok) {
      return updateResult
    }
    return Ok(updateResult.value)
  }
}

export function CreateEventService(
  eventRepository: IEventRepository,
): IEventService {
  return new EventService(eventRepository)
}
