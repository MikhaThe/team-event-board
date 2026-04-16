import type { Result } from "../lib/result";
import type { EventError } from "./errors";

export interface IRsvpRepository {
  countGoingByEventId(eventId: string): Promise<Result<number, EventError>>;
}
