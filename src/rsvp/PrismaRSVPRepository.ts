import type { IRSVPRecord, RSVPStatus } from "./RSVP";
import  { type Result, Ok, Err} from "../lib/result"
import { RSVPNotFound, UnexpectedRSVPError, type RSVPError } from "../lib/error"
import { IRSVPRepository } from "./RSVPRepository";

import { prisma } from "../lib/prismaClient"

export class PrismaRSVPRepository implements IRSVPRepository {
    async findByEvent(eventId: string): Promise<Result<IRSVPRecord[], RSVPError>> {
        try {
            const records = await prisma.rSVP.findMany({ where: { eventId: eventId } })
            return Ok(records.map(this.toRSVPRecord))
        } catch {
            return Err(RSVPNotFound("Failed to find event."))
        }
    }

    async findByUser(userId: string): Promise<Result<IRSVPRecord[], RSVPError>> {
        try {
          const records = await prisma.rSVP.findMany({ where: { userId: userId } })
          return Ok(records.map(this.toRSVPRecord))
        } catch {
          return Err(RSVPNotFound("Failed to find event."))
        }
    }
    
    async findByUserAndEvent(userId: string, eventId: string): Promise<Result<IRSVPRecord | null, RSVPError>> {
        try {
          const record = await prisma.rSVP.findFirst({ where: { eventId: eventId, userId: userId } })
          return Ok(this.toRSVPRecord(record))
        } catch {
          return Err(RSVPNotFound("Failed to find event."))
        }
    }

    async countGoingByEvent(eventId: string): Promise<Result<number, RSVPError>> {
        try {
            const count = await prisma.rSVP.count({ where: { eventId: eventId, status: "going" } })
            return Ok(count)
        } catch {
            return Err(RSVPNotFound("Failed to find RSVPs for event."))
        }
    }

    async create(userId: string, eventId: string, status: RSVPStatus): Promise<Result<IRSVPRecord, RSVPError>> {
        try {
          const event = await prisma.rSVP.create({
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
          const existing = await prisma.rSVP.findFirst({ where: { userId, eventId } })
            if (!existing) {
                return Err(RSVPNotFound("RSVP not found."))
            }
            const updated = await prisma.rSVP.update({
                where: { id: existing.id },
                data: { status },
            })
            return Ok(this.toRSVPRecord(updated))
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
