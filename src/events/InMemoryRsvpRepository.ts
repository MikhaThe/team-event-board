import { Ok, Err, type Result } from "../lib/result";
import { UnexpectedError, type EventError } from "./errors";
import type { IRsvpRepository } from "./RsvpRepository";
import type { IRsvp } from "./Event";

export const SEED_RSVPS: IRsvp[] = [
  {
    id: "rsvp-1",
    eventId: "event-2",
    userId: "user-staff",
    status: "going",
    createdAt: "2026-04-11T09:00:00.000Z",
  },
  {
    id: "rsvp-2",
    eventId: "event-2",
    userId: "user-reader",
    status: "going",
    createdAt: "2026-04-11T09:30:00.000Z",
  },
  {
    id: "rsvp-3",
    eventId: "event-3",
    userId: "user-reader",
    status: "going",
    createdAt: "2026-04-11T10:00:00.000Z",
  },
];

class InMemoryRsvpRepository implements IRsvpRepository {
  constructor(private readonly rsvps: IRsvp[]) {}

  async countGoingByEventId(eventId: string): Promise<Result<number, EventError>> {
    try {
      const count = this.rsvps.filter(
        (r) => r.eventId === eventId && r.status === "going",
      ).length;
      return Ok(count);
    } catch {
      return Err(UnexpectedError("Unable to count RSVPs."));
    }
  }
}

export function CreateInMemoryRsvpRepository(): IRsvpRepository {
  return new InMemoryRsvpRepository([...SEED_RSVPS]);
}
