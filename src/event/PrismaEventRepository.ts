import type { PrismaClient } from "@prisma/client"
import { Ok, Err, type Result } from "../lib/result"
import type { Event } from "./Event"
import type { IEventRepository } from "./EventRepository"

function toEvent(row: {
  id: string
  title: string
  description: string
  location: string
  category: string
  status: string
  organizerId: string
  organizerName: string
  startDatetime: string
  endDatetime: string
  attendeeCount: number
  capacity: number | null
}): Event {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    location: row.location,
    category: row.category,
    status: row.status as Event["status"],
    organizerId: row.organizerId,
    organizerName: row.organizerName,
    startDatetime: row.startDatetime,
    endDatetime: row.endDatetime,
    attendeeCount: row.attendeeCount,
    capacity: row.capacity ?? undefined,
  }
}

export class PrismaEventRepository implements IEventRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string): Promise<Result<Event | null, string>> {
    try {
      const row = await this.db.event.findUnique({ where: { id } })
      return Ok(row ? toEvent(row) : null)
    } catch (e) {
      return Err(String(e))
    }
  }

  async findAll(): Promise<Result<Event[], string>> {
    try {
      const rows = await this.db.event.findMany()
      return Ok(rows.map(toEvent))
    } catch (e) {
      return Err(String(e))
    }
  }

  async save(event: Event): Promise<Result<void, string>> {
    try {
      await this.db.event.upsert({
        where: { id: event.id },
        update: {
          title: event.title,
          description: event.description,
          location: event.location,
          category: event.category,
          status: event.status,
          organizerId: event.organizerId,
          organizerName: event.organizerName,
          startDatetime: event.startDatetime,
          endDatetime: event.endDatetime,
          attendeeCount: event.attendeeCount,
          capacity: event.capacity ?? null,
        },
        create: {
          id: event.id,
          title: event.title,
          description: event.description,
          location: event.location,
          category: event.category,
          status: event.status,
          organizerId: event.organizerId,
          organizerName: event.organizerName,
          startDatetime: event.startDatetime,
          endDatetime: event.endDatetime,
          attendeeCount: event.attendeeCount,
          capacity: event.capacity ?? null,
        },
      })
      return Ok(undefined)
    } catch (e) {
      return Err(String(e))
    }
  }

  async update(event: Event): Promise<Result<Event, string>> {
    try {
      const row = await this.db.event.update({
        where: { id: event.id },
        data: {
          title: event.title,
          description: event.description,
          location: event.location,
          category: event.category,
          status: event.status,
          organizerId: event.organizerId,
          organizerName: event.organizerName,
          startDatetime: event.startDatetime,
          endDatetime: event.endDatetime,
          attendeeCount: event.attendeeCount,
          capacity: event.capacity ?? null,
        },
      })
      return Ok(toEvent(row))
    } catch (e) {
      return Err(String(e))
    }
  }

  async findByOrganizerId(organizerId: string): Promise<Result<Event[], string>> {
    try {
      const rows = await this.db.event.findMany({ where: { organizerId } })
      return Ok(rows.map(toEvent))
    } catch (e) {
      return Err(String(e))
    }
  }

  async listPublishedUpcoming(now: Date): Promise<Result<Event[], string>> {
    try {
      const rows = await this.db.event.findMany({
        where: { status: "published" },
      })
      const upcoming = rows
        .map(toEvent)
        .filter(e => new Date(e.startDatetime) > now)
      return Ok(upcoming)
    } catch (e) {
      return Err(String(e))
    }
  }

  async searchPublishedUpcoming(term: string, now: Date): Promise<Result<Event[], string>> {
    try {
      const rows = await this.db.event.findMany({
        where: { status: "published" },
      })
      const lower = term.toLowerCase()
      const results = rows
        .map(toEvent)
        .filter(e => {
          if (new Date(e.startDatetime) <= now) return false
          if (!lower) return true
          return (
            e.title.toLowerCase().includes(lower) ||
            e.description.toLowerCase().includes(lower) ||
            e.location.toLowerCase().includes(lower)
          )
        })
      return Ok(results)
    } catch (e) {
      return Err(String(e))
    }
  }
}
