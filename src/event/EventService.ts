import { Err, Ok, type Result } from "../lib/result"
import { IEventRepository } from "./EventRepository"
import type { Event } from "./Event"
import { EventDetailError } from "../lib/error"

export interface IEventService {
  getEventDetail(
    eventId: string,
    viewerId?: string,
    viewerRole?: string,
  ): Promise<Result<Event, EventDetailError>>;
  editEvent(
    eventId: string,
    updates: Partial<Event>,
    viewerId?: string,
    viewerRole?: string
  ): Promise<Result<void, EventDetailError>>;
  saveEvent(event: Event): Promise<Result<void, EventDetailError>>;
  searchEvents(input: string | null,): Promise<Result<Event[], EventDetailError>>;
}

class EventService implements IEventService{

  constructor(private readonly repository: IEventRepository) {}

  async getEventDetail(eventId: string, viewerId?: string, viewerRole?: string): Promise<Result<Event, EventDetailError>> {
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

  async editEvent(eventId: string,updates: 
    Partial<Event>,
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

    if(event.status === "cancelled" || event.status === "past") {
      return Err({
        name: "Forbidden" as const,
        message: "You are not allowed to edit this event.",
      })
    }

    const updatesEvent: Event = {
      ...event,
      ...updates,
    }

    const saveResult = await this.repository.save(updatesEvent)

    if (saveResult.ok === false) {  
      return Err({
        name: "Forbidden" as const,
        message: "You are not allowed to edit this event.",
      })
    }

    return Ok(undefined);
  }

  async saveEvent(event: Event): Promise<Result<void, EventDetailError>> {
    const saveResult = await this.repository.save(event)
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
      const result = await this.repository.listPublishedUpcoming(now);
      if (!result.ok) {
        return Err({
          name: "EventNotFound" as const,
          message: "Event not found.",
        })
      }
      return Ok(result.value);
    }

    const result = await this.repository.searchPublishedUpcoming(normalized, now);
    if (result.ok === false) {
      return Err({
        name: "EventNotFound" as const,
        message: "Event not found.",
      })
    }
    return Ok(result.value);
  }
}

export function CreateEventService(repository: IEventRepository): IEventService {
  return new EventService(repository);
}