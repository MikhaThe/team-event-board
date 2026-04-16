import { Ok, Err, type Result } from "../lib/result";
import {
  EventNotFound,
  Unauthorized,
  InvalidTransition,
  UnexpectedError,
  type EventError,
} from "./errors";
import type { IEventRepository } from "./EventRepository";
import type { IRsvpRepository } from "./RsvpRepository";
import type { IEvent, IEventWithCount, IOrganizerDashboard } from "./Event";

export interface IEventService {
  publishEvent(eventId: string, organizerId: string): Promise<Result<IEvent, EventError>>;
  cancelEvent(eventId: string, organizerId: string): Promise<Result<IEvent, EventError>>;
  getOrganizerDashboard(organizerId: string): Promise<Result<IOrganizerDashboard, EventError>>;
}

class EventService implements IEventService {
  constructor(
    private readonly events: IEventRepository,
    private readonly rsvps: IRsvpRepository,
  ) {}

  async publishEvent(eventId: string, organizerId: string): Promise<Result<IEvent, EventError>> {
    const eventResult = await this.events.findById(eventId);
    if (eventResult.ok === false) {
      return Err(UnexpectedError(eventResult.value.message));
    }

    const event = eventResult.value;
    if (!event) {
      return Err(EventNotFound("Event not found."));
    }

    if (event.organizerId !== organizerId) {
      return Err(Unauthorized("Only the organizer can publish this event."));
    }

    if (event.status !== "draft") {
      return Err(
        InvalidTransition(
          `Cannot publish an event with status "${event.status}". Only draft events can be published.`,
        ),
      );
    }

    const updated: IEvent = {
      ...event,
      status: "published",
      updatedAt: new Date().toISOString(),
    };

    const updateResult = await this.events.update(updated);
    if (updateResult.ok === false) {
      return Err(UnexpectedError(updateResult.value.message));
    }

    return Ok(updateResult.value);
  }

  async cancelEvent(eventId: string, organizerId: string): Promise<Result<IEvent, EventError>> {
    const eventResult = await this.events.findById(eventId);
    if (eventResult.ok === false) {
      return Err(UnexpectedError(eventResult.value.message));
    }

    const event = eventResult.value;
    if (!event) {
      return Err(EventNotFound("Event not found."));
    }

    if (event.organizerId !== organizerId) {
      return Err(Unauthorized("Only the organizer can cancel this event."));
    }

    if (event.status !== "published") {
      return Err(
        InvalidTransition(
          `Cannot cancel an event with status "${event.status}". Only published events can be cancelled.`,
        ),
      );
    }

    const updated: IEvent = {
      ...event,
      status: "cancelled",
      updatedAt: new Date().toISOString(),
    };

    const updateResult = await this.events.update(updated);
    if (updateResult.ok === false) {
      return Err(UnexpectedError(updateResult.value.message));
    }

    return Ok(updateResult.value);
  }

  async getOrganizerDashboard(
    organizerId: string,
  ): Promise<Result<IOrganizerDashboard, EventError>> {
    const eventsResult = await this.events.findByOrganizerId(organizerId);
    if (eventsResult.ok === false) {
      return Err(UnexpectedError(eventsResult.value.message));
    }

    const eventsWithCounts: IEventWithCount[] = [];

    for (const event of eventsResult.value) {
      const countResult = await this.rsvps.countGoingByEventId(event.id);
      if (countResult.ok === false) {
        return Err(UnexpectedError(countResult.value.message));
      }
      eventsWithCounts.push({ ...event, attendeeCount: countResult.value });
    }

    const dashboard: IOrganizerDashboard = {
      draft: eventsWithCounts.filter((e) => e.status === "draft"),
      published: eventsWithCounts.filter((e) => e.status === "published"),
      cancelled: eventsWithCounts.filter((e) => e.status === "cancelled"),
      past: eventsWithCounts.filter((e) => e.status === "past"),
    };

    return Ok(dashboard);
  }
}

export function CreateEventService(
  events: IEventRepository,
  rsvps: IRsvpRepository,
): IEventService {
  return new EventService(events, rsvps);
}
