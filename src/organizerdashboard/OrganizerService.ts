import { Ok, Err, type Result } from "../lib/result";
import type { IEventRepository } from "../event/EventRepository";
import type { IRSVPRepository } from "../rsvp/RSVPRepository";
import type { IEventWithCount, IOrganizerDashboard } from "./OrganizerEvents";

export interface IOrganizerService {
  getOrganizerDashboard(organizerId: string): Promise<Result<IOrganizerDashboard, string>>;
}

class OrganizerService implements IOrganizerService {
  constructor(
    private readonly events: IEventRepository,
    private readonly rsvps: IRSVPRepository,
  ) {}

  async getOrganizerDashboard(organizerId: string): Promise<Result<IOrganizerDashboard, string>> {
    const eventsResult = await this.events.findByOrganizerId(organizerId);
    if (!eventsResult.ok) return Err(eventsResult.value);

    const eventsWithCounts: IEventWithCount[] = [];
    for (const event of eventsResult.value) {
      const countResult = await this.rsvps.countGoingByEvent(event.id);
      if (!countResult.ok) return Err(countResult.value.message);
      eventsWithCounts.push({ ...event, attendeeCount: countResult.value });
    }

    return Ok({
      draft: eventsWithCounts.filter(e => e.status === "draft"),
      published: eventsWithCounts.filter(e => e.status === "published"),
      cancelled: eventsWithCounts.filter(e => e.status === "cancelled"),
      past: eventsWithCounts.filter(e => e.status === "past"),
    });
  }
}

export function CreateOrganizerService(
  events: IEventRepository,
  rsvps: IRSVPRepository,
): IOrganizerService {
  return new OrganizerService(events, rsvps);
}
