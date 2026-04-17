import type { Result } from "../lib/result";
import type { EventError } from "./errors";
import type { IEvent } from "./Event";

export interface IEventRepository {
  findById(id: string): Promise<Result<IEvent | null, EventError>>;
  findByOrganizerId(organizerId: string): Promise<Result<IEvent[], EventError>>;
  update(event: IEvent): Promise<Result<IEvent, EventError>>;
}
