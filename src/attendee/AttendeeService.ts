import { Ok, Err, type Result } from "../lib/result";
import type { IEventRepository } from "../event/EventRepository";
import type { IRSVPRepository } from "../rsvp/RSVPRepository";
import type { IRSVPRecord } from "../rsvp/RSVP";

// ── Error types ──────────────────────────────────────────────────
export type AttendeeError =
  | { name: "EventNotFound"; message: string }
  | { name: "Forbidden"; message: string };

// ── Shape returned to the controller ────────────────────────────
export type EnrichedRSVP = IRSVPRecord & { displayName: string };

export type AttendeeListResult = {
  eventId: string;
  eventTitle: string;
  going: EnrichedRSVP[];
  waitlisted: EnrichedRSVP[];
  cancelled: EnrichedRSVP[];
};

// ── Interface ────────────────────────────────────────────────────
export interface IAttendeeService {
  getAttendeeList(
    eventId: string,
    requestingUserId: string,
    requestingUserRole: string,
    getUserDisplayName: (userId: string) => string,
  ): Promise<Result<AttendeeListResult, AttendeeError>>;
}

// ── Implementation ───────────────────────────────────────────────
class AttendeeService implements IAttendeeService {
  constructor(
    private readonly eventRepo: IEventRepository,
    private readonly rsvpRepo: IRSVPRepository,
  ) {}

  async getAttendeeList(
    eventId: string,
    requestingUserId: string,
    requestingUserRole: string,
    getUserDisplayName: (userId: string) => string,
  ): Promise<Result<AttendeeListResult, AttendeeError>> {

    // 1. Load the event
    const eventResult = await this.eventRepo.findById(eventId);
    if (!eventResult.ok || eventResult.value === null) {
      return Err({ name: "EventNotFound" as const, message: "Event not found." });
    }
    const event = eventResult.value;

    // 2. Enforce access — organizer or admin only
    const isOrganizer = event.organizerId === requestingUserId;
    const isAdmin = requestingUserRole === "admin";
    if (!isOrganizer && !isAdmin) {
      return Err({
        name: "Forbidden" as const,
        message: "Only the event organizer or an admin can view the attendee list.",
      });
    }

    // 3. Load RSVPs for this event
    const rsvpResult = await this.rsvpRepo.findByEvent(eventId);
    if (!rsvpResult.ok) {
      return Err({ name: "EventNotFound" as const, message: "Could not load RSVPs." });
    }
    const rsvps = rsvpResult.value;

    // 4. Enrich with display names
    const enriched: EnrichedRSVP[] = rsvps.map((r) => ({
      ...r,
      displayName: getUserDisplayName(r.userId),
    }));

    // 5. Sort each group by createdAt ascending
    const byDate = (a: EnrichedRSVP, b: EnrichedRSVP) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();

    return Ok({
      eventId: event.id,
      eventTitle: event.title,
      going:      enriched.filter((r) => r.status === "going").sort(byDate),
      waitlisted: enriched.filter((r) => r.status === "waitlisted").sort(byDate),
      cancelled:  enriched.filter((r) => r.status === "cancelled").sort(byDate),
    });
  }
}

export function CreateAttendeeService(
  eventRepo: IEventRepository,
  rsvpRepo: IRSVPRepository,
): IAttendeeService {
  return new AttendeeService(eventRepo, rsvpRepo);
}
