import type { IRSVPRecord, RSVPStatus } from "./RSVP";
import  { type Result, Ok, Err} from "../lib/result"
import { RSVPNotFound, type RSVPError } from "../auth/errors"


export interface IRSVPRepository {
    findByUser(userId: string): Promise<Result<IRSVPRecord[], RSVPError>>;
    findByUserAndEvent(userId: string, eventId: string): Promise<Result<IRSVPRecord | null, RSVPError>>;
    countGoingByEvent(eventId: string): Promise<Result<number, RSVPError>>
    create(rsvp: IRSVPRecord): Promise<Result<IRSVPRecord, RSVPError>>;
    updateStatus(userId: string, eventId: string, status: RSVPStatus): Promise<Result<IRSVPRecord, RSVPError>>;
}

class RSVPRepository implements IRSVPRepository {
    constructor(private readonly rsvpStore: IRSVPRecord[]) {};

    async findByUser(userId: string): Promise<Result<IRSVPRecord[], RSVPError>> {
        const records = this.rsvpStore.filter(r => r.userId === userId);
        return Ok(records);
    }

    async findByUserAndEvent(userId: string, eventId: string): Promise<Result<IRSVPRecord | null, RSVPError>> {
        const record = this.rsvpStore.find(r => r.userId == userId && r.eventId == eventId) ?? null
        return Ok(record);
    }

    async countGoingByEvent(eventId: string): Promise<Result<number, RSVPError>> {
        const count = this.rsvpStore.filter(r => r.eventId === eventId && r.status === "going").length;
        return Ok(count);
    }

    async create(rsvp: IRSVPRecord): Promise<Result<IRSVPRecord, RSVPError>> {
        this.rsvpStore.push(rsvp)
        return Ok(rsvp)
    }

    async updateStatus(userId: string, eventId: string, status: RSVPStatus): Promise<Result<IRSVPRecord, RSVPError>> {
        const record = await this.findByUserAndEvent(userId, eventId)

        if (record.ok == false) {
            return Err(RSVPNotFound("RSVP could not be found"))
        }
        if (record.value) {
            record.value.status = status;
        }
        return Ok(record.value!)
    }
}

export function CreateRSVPRepository(): IRSVPRepository {
  return new RSVPRepository([]);
}