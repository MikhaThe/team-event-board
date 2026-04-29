import { randomUUID } from "node:crypto"
import type { Event } from "./Event"
import type { Result } from "../lib/result"
import { Ok, Err } from "../lib/result"

export interface IEventRepository {
  findById(id: string): Promise<Result<Event | null, string>>
  findAll(): Promise<Result<Event[], string>>
  save(event: Event): Promise<Result<void, string>>
  findByOrganizerId(organizerId: string): Promise<Result<Event[], string>>
  update(event: Event): Promise<Result<Event, string>>
  create(data: Omit<Event, "id" | "attendeeCount">): Promise<Result<Event, string>>
  listPublishedUpcoming(now: Date): Promise<Result<Event[], string>>
  searchPublishedUpcoming(term: string, now: Date): Promise<Result<Event[], string>>
}

class EventRepository implements IEventRepository {
  private readonly events: Map<string, Event> = new Map()

  constructor() {
    this.events.set("1", {
      id: "1",
      title: "Test Event",
      description: "This is a test event for Feature 2.",
      location: "UMass Amherst",
      category: "School",
      status: "published",
      organizerId: "user-staff",
      organizerName: "Sam Staff",
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
      organizerId: "user-admin",
      organizerName: "Avery Admin",
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
      organizerId: "user-staff",
      organizerName: "Sam Staff",
      startDatetime: "2026-04-25T09:00:00",
      endDatetime: "2026-04-25T10:00:00",
      attendeeCount: 0,
      capacity: 10,
    })
  }

  async findById(id: string): Promise<Result<Event | null, string>> {
    const event = this.events.get(id) ?? null
    return Ok(event)
  }

  async findAll(): Promise<Result<Event[], string>> {
    return Ok(Array.from(this.events.values()))
  }

  async save(event: Event): Promise<Result<void, string>> {
    this.events.set(event.id, event)
    return Ok(undefined)
  }

  async findByOrganizerId(organizerId: string): Promise<Result<Event[], string>> {
    const events = Array.from(this.events.values()).filter(e => e.organizerId === organizerId)
    return Ok(events)
  }

  async update(event: Event): Promise<Result<Event, string>> {
    if (!this.events.has(event.id)) {
      return Err("Event not found.")
    }
    this.events.set(event.id, event)
    return Ok(event)
  }

  async create(data: Omit<Event, "id" | "attendeeCount">): Promise<Result<Event, string>> {
    const event: Event = {
      ...data,
      id: randomUUID(),
      attendeeCount: 0,
    }
    this.events.set(event.id, event)
    return Ok(event)
  }

  async listPublishedUpcoming(now: Date): Promise<Result<Event[], string>> {
    const events = Array.from(this.events.values()).filter((e) => {
      const start = new Date(e.startDatetime)
      return e.status === "published" && start > now
    })
    return Ok(events)
  }

  async searchPublishedUpcoming(term: string, now: Date): Promise<Result<Event[], string>> {
    const events = Array.from(this.events.values()).filter((e) => {
      const start = new Date(e.startDatetime)
      if (e.status !== "published" || start <= now) return false
      if (!term) return true
      return (
        e.title.toLowerCase().includes(term) ||
        e.description.toLowerCase().includes(term) ||
        e.location.toLowerCase().includes(term)
      )
    })
    return Ok(events)
  }
}

export function InMemoryEventRepository(): IEventRepository {
  return new EventRepository()
}
