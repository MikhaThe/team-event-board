import { IRSVPRecord, type RSVPStatus} from "./RSVP";
import { IRSVPRepository } from "./RSVPrepository";

export interface ToggleRSVPInput {
  userId: string;
  eventId: string;
  capacity: number;
}

export interface IRSVPService {
  toggleRSVP(input: ToggleRSVPInput): IRSVPRecord | null
}

class RSVPService implements IRSVPService {
  constructor(private readonly repo: IRSVPRepository) {}

  toggleRSVP(input: ToggleRSVPInput): IRSVPRecord | null {
    const userId = input.userId?.trim();
    const eventId = input.eventId?.trim();
    const capacity = input.capacity;

    if (!userId) {
      throw new Error("User ID is required.")
    }

    if (!eventId) {
      throw new Error("Event ID is required.");
    }

    if (capacity < 0) {
      throw new Error("Capacity must be >= 0.");
    }

    const existingEvent = this.repo.findByUserAndEvent(userId, eventId);
    const goingCount = this.repo.countGoingByEvent(eventId);

    if (existingEvent == null) {
      const status: RSVPStatus = goingCount < capacity ? "going" : "waitlisted";

      const createResult = this.repo.create({ // adding new RSVP
        userId,
        eventId,
        status,
      });
      return createResult
    }

    if (existingEvent.status === "going" || existingEvent.status === "waitlisted") { // cancelling RSVP
      const updateResult = this.repo.updateStatus(userId, eventId, "cancelled",);
      return updateResult
    }

    if (existingEvent.status === "cancelled") { // reactivating cancelled RSVP
      const status: RSVPStatus = goingCount < capacity ? "going" : "waitlisted";
      const updateResult = this.repo.updateStatus(userId, eventId, status);

      return updateResult
    }
    return null
  }
}



export function CreateRSVPService(repo: IRSVPRepository): IRSVPService {
  return new RSVPService(repo);
}