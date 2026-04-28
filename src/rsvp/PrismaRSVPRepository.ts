import type { IRSVPRecord, RSVPStatus } from "./RSVP";
import  { type Result, Ok, Err} from "../lib/result"
import { RSVPNotFound, UnexpectedRSVPError, type RSVPError } from "../lib/error"
import { PrismaClient } from "@prisma/client"
import { IRSVPRepository } from "./RSVPRepository";

const prisma = new PrismaClient()

export class PrismaRSVPRepository implements IRSVPRepository {
    async findByEvent(eventId: string): Promise<Result<IRSVPRecord[], RSVPError>> {
        try {
            const records = await prisma.rsvp.findAll({ where: { eventId: eventId } }) as IRSVPRecord[]
            return Ok(records.map(this.toRSVPRecord))
        } catch {
            return Err(RSVPNotFound("Failed to find event."))
        }
    }

    async findByUser(userId: string): Promise<Result<IRSVPRecord[], RSVPError>> {
        try {
          const records = await prisma.rsvp.findAll({ where: { userId: userId } }) as IRSVPRecord[]
          return Ok(records.map(this.toRSVPRecord))
        } catch {
          return Err(RSVPNotFound("Failed to find event."))
        }
    }
    
    async findByUserAndEvent(userId: string, eventId: string): Promise<Result<IRSVPRecord | null, RSVPError>> {
        try {
          const record = await prisma.rsvp.findUnique({ where: { eventId: eventId, userId: userId } })
          return Ok(this.toRSVPRecord(record))
        } catch {
          return Err(RSVPNotFound("Failed to find event."))
        }
    }

    async countGoingByEvent(eventId: string): Promise<Result<number, RSVPError>> {
        try {
            const records = await prisma.rsvp.findAll({ where: { eventId: eventId, status: "going" } }) as IRSVPRecord[]
            return Ok(records.length)
        } catch {
            return Err(RSVPNotFound("Failed to find RSVPs for event."))
        }
    }

    async create(userId: string, eventId: string, status: RSVPStatus): Promise<Result<IRSVPRecord, RSVPError>> {
        try {
          const event = await prisma.event.create({
            data: {
                userId: userId,
                eventId: eventId,
                status: status,
                id: crypto.randomUUID(),
                createdAt: new Date()
            },
          })
          return Ok(this.toRSVPRecord(event))
        } catch {
          return Err(UnexpectedRSVPError("Failed to create RSVP."))
        }
    }
    
    async updateStatus(userId: string, eventId: string, status: RSVPStatus): Promise<Result<IRSVPRecord, RSVPError>> {
        try {
          const event = await prisma.event.update({
            data: {
                userId: userId,
                eventId: eventId,
                status: status,
                id: crypto.randomUUID(),
                createdAt: new Date()
            },
          })
          return Ok(this.toRSVPRecord(event))
        } catch {
          return Err(UnexpectedRSVPError("Failed to create RSVP."))
        }

    }

    private toRSVPRecord(raw: any): IRSVPRecord {
        return {
            userId: raw.userId,
            eventId: raw.eventId,
            status: raw.status as RSVPStatus,
            id: raw.id,
            createdAt: raw.createdAt as Date
        }
    }
}

export function CreatePrismaRSVPRepository(): IRSVPRepository {
  return new PrismaRSVPRepository()
}
