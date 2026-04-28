import type { PrismaClient } from "@prisma/client"
import { Ok, Err, type Result } from "../lib/result"
import type { IRSVPRecord, RSVPStatus } from "./RSVP"
import type { IRSVPRepository } from "./RSVPRepository"
import { RSVPNotFound, type RSVPError } from "../auth/errors"

function toRecord(row: {
  id: string
  userId: string
  eventId: string
  status: string
  createdAt: Date
}): IRSVPRecord {
  return {
    id: row.id,
    userId: row.userId,
    eventId: row.eventId,
    status: row.status as RSVPStatus,
    createdAt: row.createdAt,
  }
}

export class PrismaRSVPRepository implements IRSVPRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByEvent(eventId: string): Promise<Result<IRSVPRecord[], RSVPError>> {
    try {
      const rows = await this.db.rSVP.findMany({ where: { eventId } })
      return Ok(rows.map(toRecord))
    } catch (e) {
      return Err(RSVPNotFound(String(e)))
    }
  }

  async findByUser(userId: string): Promise<Result<IRSVPRecord[], RSVPError>> {
    try {
      const rows = await this.db.rSVP.findMany({ where: { userId } })
      return Ok(rows.map(toRecord))
    } catch (e) {
      return Err(RSVPNotFound(String(e)))
    }
  }

  async findByUserAndEvent(userId: string, eventId: string): Promise<Result<IRSVPRecord | null, RSVPError>> {
    try {
      const row = await this.db.rSVP.findUnique({ where: { userId_eventId: { userId, eventId } } })
      return Ok(row ? toRecord(row) : null)
    } catch (e) {
      return Err(RSVPNotFound(String(e)))
    }
  }

  async countGoingByEvent(eventId: string): Promise<Result<number, RSVPError>> {
    try {
      const count = await this.db.rSVP.count({ where: { eventId, status: "going" } })
      return Ok(count)
    } catch (e) {
      return Err(RSVPNotFound(String(e)))
    }
  }

  async create(userId: string, eventId: string, status: RSVPStatus): Promise<Result<IRSVPRecord, RSVPError>> {
    try {
      const row = await this.db.rSVP.create({
        data: { userId, eventId, status },
      })
      return Ok(toRecord(row))
    } catch (e) {
      return Err(RSVPNotFound(String(e)))
    }
  }

  async updateStatus(userId: string, eventId: string, status: RSVPStatus): Promise<Result<IRSVPRecord, RSVPError>> {
    try {
      const row = await this.db.rSVP.update({
        where: { userId_eventId: { userId, eventId } },
        data: { status },
      })
      return Ok(toRecord(row))
    } catch (e) {
      return Err(RSVPNotFound("RSVP not found"))
    }
  }
}
