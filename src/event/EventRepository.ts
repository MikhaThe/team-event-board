import type { Event } from "./Event"
import type { Result } from "../lib/result"

export interface IEventRepository {
  findById(id: string): Promise<Result<Event | null, string>>
  findAll(): Promise<Result<Event[], string>>
  save(event: Event): Promise<Result<void, string>>
  findByOrganizerId(organizerId: string): Promise<Result<Event[], string>>
  update(event: Event): Promise<Result<Event, string>>
}

class EventRepository implements IEventRepository {
  private events = new Map<string, Event>()

  constructor() {
    this.events.set("1", {
      id: "1",
      title: "Test Event",
      description: "This is a test event for Feature 2.",
      location: "UMass Amherst",
      category: "School",
      status: "published",
      organizerId: "user1",
      organizerName: "Una User",
      startDatetime: "2026-04-20T10:00:00",
      endDatetime: "2026-04-20T12:00:00",
      attendeeCount: 10,
      capacity: 20,
    })

    this.events.set("2", {
      id: "2",
      title: "Music Night",
      description: "Live music event on campus.",
      location: "Campus Center",
      category: "Music",
      status: "published",
      organizerId: "user2",
      organizerName: "Sam Staff",
      startDatetime: "2026-04-22T18:00:00",
      endDatetime: "2026-04-22T20:00:00",
      attendeeCount: 30,
      capacity: 50,
    })

    this.events.set("3", {
      id: "3",
      title: "Private Draft Event",
      description: "This is a draft event.",
      location: "Hidden Room",
      category: "School",
      status: "draft",
      organizerId: "user1",
      organizerName: "Una User",
      startDatetime: "2026-04-25T09:00:00",
      endDatetime: "2026-04-25T10:00:00",
      attendeeCount: 0,
      capacity: 10,
    })
  }

  async findById(id: string): Promise<Result<Event | null, string>> {
    return { ok: true, value: this.events.get(id) ?? null }
  }

  async findAll(): Promise<Result<Event[], string>> {
    return { ok: true, value: Array.from(this.events.values()) }
  }

  async save(event: Event): Promise<Result<void, string>> {
    this.events.set(event.id, event)
    return { ok: true, value: undefined }
  }

  async findByOrganizerId(organizerId: string): Promise<Result<Event[], string>> {
    const events = Array.from(this.events.values()).filter(e => e.organizerId === organizerId)
    return { ok: true, value: events }
  }

  async update(event: Event): Promise<Result<Event, string>> {
    if (!this.events.has(event.id)) {
      return { ok: false, value: "Event not found." }
    }
    this.events.set(event.id, event)
    return { ok: true, value: event }
  }
}

export function InMemoryEventRepository(): IEventRepository {
  return new EventRepository()
}