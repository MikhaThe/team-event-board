import type { Event } from "./Event"
import type { Result } from "../lib/result"

export interface IEventRepository {
  findById(id: string): Promise<Result<Event | null, string>>
  save(event: Event): Promise<Result<void, string>>
}

// simple in-memory store
class EventRepository implements IEventRepository {
  private events = new Map<string, Event>()

  async findById(id: string): Promise<Result<Event | null, string>> {
    return { ok: true, value: this.events.get(id) ?? null }  
  }

  async save(event: Event): Promise<Result<void, string>> {
    this.events.set(event.id, event)
    return { ok: true, value: undefined }
  }
}

export function InMemoryEventRepository(): IEventRepository {
  return new EventRepository()
}