import type { Event } from "./Event"
import type { Result } from "../lib/result"
import type { AuthError } from "../auth/errors"
import { Ok } from "../lib/result"

export interface IEventRepository {
  findById(id: string): Promise<Result<Event | null, string>>
  findAll(): Promise<Result<Event[], string>>
  save(event: Event): Promise<Result<void, string>>
  findByOrganizerId(organizerId: string): Promise<Result<Event[], string>>
  update(event: Event): Promise<Result<Event, string>>
  listPublishedUpcoming(now: Date): Promise<Result<Event[], string>>
  searchPublishedUpcoming(term: string, now: Date): Promise<Result<Event[], string>>
}

class EventRepository implements IEventRepository {
  private events: Event[] = []

  constructor() {
    this.events.push({
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

    this.events.push({
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

    this.events.push({
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
    const event = this.events.find(e => e.id === id) ?? null
    return Ok(event)
  }

  async findAll(): Promise<Result<Event[], string>> {
    return Ok([...this.events])
  }

  async save(event: Event): Promise<Result<void, string>> {
    this.events.push(event)
    return Ok(undefined)
  }

  async listPublishedUpcoming(now: Date): Promise<Result<Event[], string>> {
    const events = this.events.filter((e) => {
      const start = new Date(e.startDatetime)
      return e.status === "published" && start > now
    })
    return Ok(events)
  }

  async searchPublishedUpcoming(term: string, now: Date): Promise<Result<Event[], string>> {
    const events = this.events.filter((e) => {
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

  async findByOrganizerId(organizerId: string): Promise<Result<Event[], string>> {
    const events = this.events.filter(e => e.organizerId === organizerId)
    return Ok(events)
  }

  async update(event: Event): Promise<Result<Event, string>> {
    const index = this.events.findIndex(e => e.id === event.id)
    if (index === -1) {
      return { ok: false, value: "Event not found." }
    }
    this.events[index] = event
    return { ok: true, value: event }
  }
}

export function InMemoryEventRepository(): IEventRepository {
  return new EventRepository()
}