import { IRSVPRecord, type RSVPStatus} from "./RSVP";
import { IRSVPRepository } from "./RSVPRepository";
import { AuthError, ValidationError, UnexpectedDependencyError } from "../auth/errors"
import { type Result, Ok, Err} from "../lib/result"

export interface ToggleRSVPInput {
  userId: string;
  eventId: string;
  capacity: number;
}

export interface IRSVPService {
  toggleRSVP(input: ToggleRSVPInput): Promise<Result<IRSVPRecord, AuthError>>
}

class RSVPService implements IRSVPService {
  constructor(private readonly repo: IRSVPRepository) {}

  async toggleRSVP(
    input: ToggleRSVPInput,
  ): Promise<Result<IRSVPRecord, AuthError>> {
    const userId = input.userId?.trim();
    const eventId = input.eventId?.trim();
    const capacity = input.capacity;

    if (!userId) {
      return Err(ValidationError("User ID is required."));
    }
    if (!eventId) {
      return Err(ValidationError("Event ID is required."));
    }
    if (capacity < 0) {
      return Err(ValidationError("Capacity must be >= 0."));
    }

    const existingResult = await this.repo.findByUserAndEvent(userId, eventId);
    if (existingResult.ok === false) {
      return Err(UnexpectedDependencyError(existingResult.value.message));
    }

    const existing = existingResult.value;
    const countResult = await this.repo.countGoingByEvent(eventId);
    if (countResult.ok === false) {
      return Err(UnexpectedDependencyError(countResult.value.message));
    }

    const goingCount = countResult.value;
    if (!existing) {
      const status: RSVPStatus = goingCount < capacity ? "going" : "waitlisted";

      const createResult = await this.repo.create({
        userId,
        eventId,
        status,
      });

      if (createResult.ok === false) {
        return Err(UnexpectedDependencyError(createResult.value.message));
      }
      return Ok(createResult.value);
    }

    if (existing.status === "going" || existing.status === "waitlisted") {
      const updateResult = await this.repo.updateStatus(
        userId,
        eventId,
        "cancelled",
      );

      if (updateResult.ok === false) {
        return Err(UnexpectedDependencyError(updateResult.value.message));
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
        return Err(UnexpectedDependencyError(updateResult.value.message));
      }
      return Ok(updateResult.value);
    }

    return Err(ValidationError("Invalid RSVP state."));
  }
}

export function CreateRSVPService(repo: IRSVPRepository): IRSVPService {
  return new RSVPService(repo);
}