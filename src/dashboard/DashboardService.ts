import type { IEventRepository } from "../event/EventRepository";
import type { IRSVPRepository } from "../rsvp/RSVPRepository";
import type { IDashboardView, IDashboardEvent } from "./DashboardEvent";
import { type Result, Ok, Err } from "../lib/result";
import { UnexpectedDependencyError } from "../auth/errors";
import type { AuthError } from "../auth/errors";

export interface IDashboardService {
  getDashboard(userId: string): Promise<Result<IDashboardView, AuthError>>;
}

class DashboardService implements IDashboardService {
  constructor(
    private readonly rsvpRepo: IRSVPRepository,
    private readonly eventRepo: IEventRepository,
  ) {}

  async getDashboard(userId: string): Promise<Result<IDashboardView, AuthError>> {
    const rsvpResult = await this.rsvpRepo.findByUser(userId);
    if (rsvpResult.ok === false) {
      return Err(UnexpectedDependencyError(rsvpResult.value.message));
    }

    const rsvps = rsvpResult.value;
    if (rsvps.length === 0) {
      return Ok({ upcoming: [], past: [] });
    }

    const eventResult = await this.eventRepo.findAll();
    if (eventResult.ok === false) {
      return Err(UnexpectedDependencyError(eventResult.value));
    }

    const rsvpedIds = new Set(rsvps.map((r) => r.eventId));
    const eventMap = new Map(
      eventResult.value
        .filter((e) => rsvpedIds.has(e.id))
        .map((e) => [e.id, e]),
    );

    const now = new Date();
    const upcoming: IDashboardEvent[] = [];
    const past: IDashboardEvent[]     = [];

    for (const rsvp of rsvps) {
      const event = eventMap.get(rsvp.eventId);
      if (!event) continue;

      const entry: IDashboardEvent = {
        eventId:       event.id,
        title:         event.title,
        startDatetime: event.startDatetime,
        endDatetime:   event.endDatetime,
        location:      event.location,
        status:        rsvp.status,
      };

      const isElapsed   = new Date(event.startDatetime) < now;
      const isCancelled = rsvp.status === "cancelled";

      if (!isCancelled && !isElapsed) {
        upcoming.push(entry);
      } else {
        past.push(entry);
      }
    }

    upcoming.sort((a, b) =>
      new Date(a.startDatetime).getTime() - new Date(b.startDatetime).getTime()
    );
    past.sort((a, b) =>
      new Date(b.startDatetime).getTime() - new Date(a.startDatetime).getTime()
    );

    return Ok({ upcoming, past });
  }
}

export function CreateDashboardService(
  rsvpRepo: IRSVPRepository,
  eventRepo: IEventRepository,
): IDashboardService {
  return new DashboardService(rsvpRepo, eventRepo);
}