import type { Event } from "./Event"
import type { IEventRepository } from "./EventRepository"
import { Ok, Err } from "../lib/result"
import type { Result } from "../lib/result"
import { EventNotFound } from "../lib/error"
import type { EventDetailError } from "../lib/error"
import { prisma } from "../lib/prismaClient"

export class PrismaEventRepository implements IEventRepository {
  async findById(id: string): Promise<Result<Event | null, EventDetailError>> {
    try {
      const event = await prisma.event.findUnique({ where: { id } })
      if (!event) return Ok(null)
      return Ok(this.toEvent(event))
    } catch {
      return Err(EventNotFound("Failed to find event."))
    }
  }

  async findAll(): Promise<Result<Event[], EventDetailError>> {
    try {
      const events = await prisma.event.findMany()
      return Ok(events.map(this.toEvent))
    } catch {
      return Err(EventNotFound("Failed to fetch events."))
    }
  }

  async save(event: Event): Promise<Result<void, EventDetailError>> {
    try {
      await prisma.event.upsert({
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
    } catch {
      return Err(EventNotFound("Failed to save event."))
    }
  }

  async listPublishedUpcoming(now: Date): Promise<Result<Event[], EventDetailError>> {
    try {
      const events = await prisma.event.findMany({
        where: {
          status: "published",
          startDatetime: { gt: now.toISOString() },
        },
      })
      return Ok(events.map(this.toEvent))
    } catch {
      return Err(EventNotFound("Failed to fetch events."))
    }
  }

  async searchPublishedUpcoming(term: string, now: Date): Promise<Result<Event[], EventDetailError>> {
    try {
      const events = await prisma.event.findMany({
        where: {
          status: "published",
          startDatetime: { gt: now.toISOString() },
          OR: [
            { title: { contains: term } },
            { description: { contains: term } },
            { location: { contains: term } },
          ],
        },
      })
      return Ok(events.map(this.toEvent))
    } catch {
      return Err(EventNotFound("Failed to search events."))
    }
  }

  async findByOrganizerId(organizerId: string): Promise<Result<Event[], EventDetailError>> {
    try {
      const events = await prisma.event.findMany({ where: { organizerId } })
      return Ok(events.map(this.toEvent))
    } catch {
      return Err(EventNotFound("Failed to fetch events."))
    }
  }

  async update(event: Event): Promise<Result<Event, EventDetailError>> {
    try {
      const updated = await prisma.event.update({
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
      return Ok(this.toEvent(updated))
    } catch {
      return Err(EventNotFound("Failed to update event."))
    }
  }

  async create(data: Omit<Event, "id" | "attendeeCount">): Promise<Result<Event, EventDetailError>> {
    try {
      const event = await prisma.event.create({
        data: {
          title: data.title,
          description: data.description,
          location: data.location,
          category: data.category,
          status: data.status,
          organizerId: data.organizerId,
          organizerName: data.organizerName,
          startDatetime: data.startDatetime,
          endDatetime: data.endDatetime,
          capacity: data.capacity ?? null,
        },
      })
      return Ok(this.toEvent(event))
    } catch {
      return Err(EventNotFound("Failed to create event."))
    }
  }

  private toEvent(raw: any): Event {
    return {
      id: raw.id,
      title: raw.title,
      description: raw.description,
      location: raw.location,
      category: raw.category,
      status: raw.status as Event["status"],
      organizerId: raw.organizerId,
      organizerName: raw.organizerName,
      startDatetime: raw.startDatetime,
      endDatetime: raw.endDatetime,
      attendeeCount: raw.attendeeCount,
      capacity: raw.capacity ?? undefined,
    }
  }
}

export function CreatePrismaEventRepository(): IEventRepository {
  return new PrismaEventRepository()
}
