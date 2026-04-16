import type { Event } from "./Event"
import type { Result } from "../lib/result"
import type { AuthError } from "../auth/errors"
import { Ok } from "../lib/result"

export interface IEventRepository {
  findById(id: string): Promise<Result<Event | null, string>>
  save(event: Event): Promise<Result<void, string>>
  searchPublishedUpcoming(term: string, now: Date): Promise<Result<Event[], AuthError>>;
  listPublishedUpcoming(now: Date): Promise<Result<Event[], AuthError>>;
}

// simple in-memory store
class EventRepository implements IEventRepository {
  private events: Event[] = []

  async findById(id: string): Promise<Result<Event | null, string>> {
    const event = this.events.find(e => e.id == id) ?? null
    return Ok(event) 
  }

  async save(event: Event): Promise<Result<void, string>> {
    this.events.push(event)
    return Ok(undefined)
  }

  async listPublishedUpcoming(now: Date) {
    const events = this.events.filter((e) => {
      const start = new Date(e.startDatetime);

      return e.status === "published" && start > now;
    });

    return Ok(events);
  }

  async searchPublishedUpcoming(term: string, now: Date) {
    const normalized = term.trim().toLowerCase();

    const events = this.events.filter((e) => {
      const start = new Date(e.startDatetime);

      if (e.status !== "published" || start <= now) {
        return false;
      }

      if (!normalized) {
        return true;
      }

      return (
        e.title.toLowerCase().includes(normalized) ||
        e.description.toLowerCase().includes(normalized) ||
        e.location.toLowerCase().includes(normalized)
      );
    });

    return Ok(events);
  }
}

export function InMemoryEventRepository(): IEventRepository {
  return new EventRepository()
}