import { IRSVPRecord, type RSVPStatus} from "./RSVP";
import { IRSVPRepository } from "./RSVPRepository";
import { type Result, Ok, Err} from "../lib/result"
import { type RSVPError, RSVPNotFound, InvalidRSVP, UnexpectedRSVPError } from "../lib/error";
import { IEventRepository } from "../event/EventRepository";
import type { Event } from "../event/Event"

export interface ToggleRSVPInput {
  userId: String;
  eventId: String;
}

export interface ToggleRSVPResult {
  rsvp: IRSVPRecord;
  capacity: number;
  attendeeCount: number;
}

export interface IRSVPService {
  toggleRSVP(input: ToggleRSVPInput): Promise<Result<ToggleRSVPResult, RSVPError>>
  cancelRSVP(input: ToggleRSVPInput): Promise<Result<ToggleRSVPResult, RSVPError>>
}

class RSVPService implements IRSVPService {
  constructor(
    private readonly rsvpRepo: IRSVPRepository,
    private readonly eventRepo: IEventRepository,
  ) {}

  async toggleRSVP(
    input: ToggleRSVPInput,
  ): Promise<Result<ToggleRSVPResult, RSVPError>> {
    const userId = input.userId?.trim();
    const eventId = input.eventId?.trim();
    const eventResult = await this.eventRepo.findById(eventId)
    
    if (!eventResult.ok || !eventResult.value) {
      return Err(RSVPNotFound("Event could not be found"))
    }
    const event = eventResult.value as Event
    const capacity = event.capacity;

    if (!userId) {
      return Err(InvalidRSVP("User ID is required."));
    }
    if (!eventId) {
      return Err(InvalidRSVP("Event ID is required."));
    }
    if (!capacity || capacity < 0) {
      return Err(InvalidRSVP("Capacity must be >= 0."));
    }

    const existingResult = await this.rsvpRepo.findByUserAndEvent(userId, eventId);
    if (!existingResult.ok) {
      return Err(RSVPNotFound("RSVP could not be found"));
    }

    const existing = existingResult.value;
    const countResult = await this.rsvpRepo.countGoingByEvent(eventId);

    const goingCount = Number(countResult.value);
    if (!existing) {
      const status: RSVPStatus = !capacity || event.attendeeCount < capacity ? "going" : "waitlisted";

      const createResult = await this.rsvpRepo.create(userId, eventId, status);

      if (createResult.ok === false) {
        return Err(InvalidRSVP("RSVP could not be created"));
      }
      if (status === "going") {
        event.attendeeCount++;
        this.eventRepo.update(event)
      }
      return Ok({
        rsvp: createResult.value, 
        capacity: capacity, 
        attendeeCount: event.attendeeCount});
    }

    if (existing.status === "going" || existing.status === "waitlisted") {
      const oldStatus = existing.status;
      const updateResult = await this.rsvpRepo.updateStatus(
        userId,
        eventId,
        "cancelled",
      );

      if (updateResult.ok === false) {
        return Err(RSVPNotFound(updateResult.value.message));
      }
      if (oldStatus === "going") {
        event.attendeeCount--;
        this.eventRepo.update(event)
      }
      return Ok({
        rsvp: updateResult.value, 
        capacity: capacity, 
        attendeeCount: event.attendeeCount});
    }

    if (existing.status === "cancelled") {
      const status: RSVPStatus = !capacity || event.attendeeCount < capacity ? "going" : "waitlisted";
      const updateResult = await this.rsvpRepo.updateStatus(
        userId,
        eventId,
        status,
      );

      if (updateResult.ok === false) {
        return Err(RSVPNotFound(updateResult.value.message));
      }
      if (status === "going") {
        event.attendeeCount++;
        this.eventRepo.update(event)
      }
      return Ok({
        rsvp: updateResult.value, 
        capacity: capacity, 
        attendeeCount: event.attendeeCount});
    }

    return Err(UnexpectedRSVPError("Invalid RSVP state."));
  }

  async cancelRSVP(
    input: ToggleRSVPInput,
  ): Promise<Result<ToggleRSVPResult, RSVPError>> {
    const userId = input.userId?.trim();
    const eventId = input.eventId?.trim();

    if (!userId) {
      return Err(InvalidRSVP("User ID is required."));
    }
    if (!eventId) {
      return Err(InvalidRSVP("Event ID is required."));
    }

    const eventResult = await this.eventRepo.findById(eventId);
    if (!eventResult.ok || !eventResult.value) {
      return Err(RSVPNotFound("Event could not be found"));
    }
    const event = eventResult.value as Event;

    const existingResult = await this.rsvpRepo.findByUserAndEvent(userId, eventId);
    if (!existingResult.ok) {
      return Err(RSVPNotFound("RSVP could not be found"));
    }

    const existing = existingResult.value;
    if (!existing || existing.status === "cancelled") {
      return Err(InvalidRSVP("No active RSVP to cancel."));
    }

    const oldStatus = existing.status;
    const updateResult = await this.rsvpRepo.updateStatus(userId, eventId, "cancelled");

    if (updateResult.ok === false) {
      return Err(RSVPNotFound(updateResult.value.message));
    }

    if (oldStatus === "going") {
      event.attendeeCount--;
      this.eventRepo.update(event);
    }

    return Ok({
      rsvp: updateResult.value,
      capacity: event.capacity ?? 0,
      attendeeCount: event.attendeeCount,
    });
  }
}

export function CreateRSVPService(rsvpRepo: IRSVPRepository, eventRepo: IEventRepository): IRSVPService {
  return new RSVPService(rsvpRepo, eventRepo);
}