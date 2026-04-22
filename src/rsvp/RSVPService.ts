import { IRSVPRecord, type RSVPStatus} from "./RSVP";
import { IRSVPRepository } from "./RSVPRepository";
import { type Result, Ok, Err} from "../lib/result"
import { type RSVPError, RSVPNotFound, InvalidRSVP, UnexpectedRSVPError } from "../lib/error";

export interface ToggleRSVPInput {
  userId: string;
  eventId: string;
  capacity: number;
}

export interface IRSVPService {
  toggleRSVP(input: ToggleRSVPInput): Promise<Result<IRSVPRecord, RSVPError>>
}

class RSVPService implements IRSVPService {
  constructor(private readonly repo: IRSVPRepository) {}

  async toggleRSVP(
    input: ToggleRSVPInput,
  ): Promise<Result<IRSVPRecord, RSVPError>> {
    const userId = input.userId?.trim();
    const eventId = input.eventId?.trim();
    const capacity = input.capacity;

    if (!userId) {
      return Err(InvalidRSVP("User ID is required."));
    }
    if (!eventId) {
      return Err(InvalidRSVP("Event ID is required."));
    }
    if (capacity < 0) {
      return Err(InvalidRSVP("Capacity must be >= 0."));
    }

    const existingResult = await this.repo.findByUserAndEvent(userId, eventId);
    if (existingResult.value === null) {
      return Err(RSVPNotFound("RSVP could not be found"));
    }

    const existing = existingResult.value as IRSVPRecord;
    const countResult = await this.repo.countGoingByEvent(eventId);
    if (countResult.value === 0) {
      return Err(RSVPNotFound("No RSVP could be found"));
    }

    const goingCount = Number(countResult.value);
    if (!existing) {
      const status: RSVPStatus = goingCount < capacity ? "going" : "waitlisted";

      const createResult = await this.repo.create(userId, eventId, status);

      if (createResult.ok === false) {
        return Err(InvalidRSVP("RSVP could not be created"));
      }
      return Ok(createResult.value);
    }

    if (existing.status === "going" || existing!.status === "waitlisted") {
      const updateResult = await this.repo.updateStatus(
        userId,
        eventId,
        "cancelled",
      );

      if (updateResult.ok === false) {
        return Err(RSVPNotFound(updateResult.value.message));
      }
      return Ok(updateResult.value);
    }

    if (existing.status === "cancelled") {
      const status: RSVPStatus =
        goingCount < capacity ? "going" : "waitlisted";
      const updateResult = await this.repo.updateStatus(
        userId,
        eventId,
        status,
      );

      if (updateResult.ok === false) {
        return Err(RSVPNotFound(updateResult.value.message));
      }
      return Ok(updateResult.value);
    }

    return Err(UnexpectedRSVPError("Invalid RSVP state."));
  }
}

export function CreateRSVPService(repo: IRSVPRepository): IRSVPService {
  return new RSVPService(repo);
}