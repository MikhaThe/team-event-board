import type { IRSVPRepository } from "./RSVPRepository";
import type { IRSVPRecord, RSVPStatus } from "./RSVP";
import { Ok, Err } from "../lib/result";
import type { Result } from "../lib/result";
import { RSVPNotFound, type RSVPError } from "../lib/error";
import { prisma } from "../lib/prismaClient";

class PrismaRSVPRepository implements IRSVPRepository {

  async findByEvent(eventId: string): Promise<Result<IRSVPRecord[], RSVPError>> {
    try {
      const records = await prisma.rSVP.findMany({
        where: { eventId },
        orderBy: { createdAt: "asc" },
      });
      return Ok(records.map(this.toRecord));
    } catch {
      return Err(RSVPNotFound("Failed to fetch RSVPs for event."));
    }
  }

  async findByUser(userId: string): Promise<Result<IRSVPRecord[], RSVPError>> {
    try {
      const records = await prisma.rSVP.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
      });
      return Ok(records.map(this.toRecord));
    } catch {
      return Err(RSVPNotFound("Failed to fetch RSVPs for user."));
    }
  }

  async findByUserAndEvent(
    userId: string,
    eventId: string
  ): Promise<Result<IRSVPRecord | null, RSVPError>> {
    try {
      const record = await prisma.rSVP.findUnique({
        where: { userId_eventId: { userId, eventId } },
      });
      return Ok(record ? this.toRecord(record) : null);
    } catch {
      return Err(RSVPNotFound("Failed to fetch RSVP."));
    }
  }

  async countGoingByEvent(eventId: string): Promise<Result<number, RSVPError>> {
    try {
      const count = await prisma.rSVP.count({
        where: { eventId, status: "going" },
      });
      return Ok(count);
    } catch {
      return Err(RSVPNotFound("Failed to count RSVPs."));
    }
  }

  async create(userId: string, eventId: string, status: RSVPStatus): Promise<Result<IRSVPRecord, RSVPError>> {
    try {
      const record = await prisma.rSVP.create({
        data: {
          eventId,
          userId,
          status,
        },
      });
      return Ok(this.toRecord(record));
    } catch {
      return Err(RSVPNotFound("Failed to create RSVP."));
    }
  }

  async updateStatus(
    userId: string,
    eventId: string,
    status: RSVPStatus
  ): Promise<Result<IRSVPRecord, RSVPError>> {
    try {
      const record = await prisma.rSVP.update({
        where: { userId_eventId: { userId, eventId } },
        data: { status },
      });
      return Ok(this.toRecord(record));
    } catch {
      return Err(RSVPNotFound("RSVP not found for update."));
    }
  }

  private toRecord(r: {
    id: string;
    eventId: string;
    userId: string;
    status: string;
    createdAt: Date;
  }): IRSVPRecord {
    return {
      id: r.id,
      eventId: r.eventId,
      userId: r.userId,
      status: r.status as RSVPStatus,
      createdAt: r.createdAt,
    };
  }
}

export function CreatePrismaRSVPRepository(): IRSVPRepository {
  return new PrismaRSVPRepository();
}
