import type { IRSVPRecord, RSVPStatus } from "./RSVP";
import  { type Result, Ok, Err} from "../lib/result"
import { RSVPNotFound, type RSVPError } from "../lib/error"


export interface IRSVPRepository {
    findByEvent(eventId: string): Promise<Result<IRSVPRecord[], RSVPError>>;
    findByUser(userId: string): Promise<Result<IRSVPRecord[], RSVPError>>;
    findByUserAndEvent(userId: string, eventId: string): Promise<Result<IRSVPRecord | null, RSVPError>>;
    countGoingByEvent(eventId: string): Promise<Result<number, RSVPError>>
    create(userId: string, eventId: string, status: RSVPStatus): Promise<Result<IRSVPRecord, RSVPError>>;
    updateStatus(userId: string, eventId: string, status: RSVPStatus): Promise<Result<IRSVPRecord, RSVPError>>;
}

class RSVPRepository implements IRSVPRepository {
    constructor(private readonly rsvpStore: IRSVPRecord[]) {
        for (let i = 0; i < 10; i++) {
            this.rsvpStore.push({
                userId: "user-random",
                eventId: "1",
                status: "going",
                id: (i).toString(),
                createdAt: new Date(),
            });
        }
        for (let i = 0; i < 30; i++) {
            this.rsvpStore.push({
                userId: "user-random",
                eventId: "2",
                status: "going",
                id: (10+i).toString(),
                createdAt: new Date(),
            });
        }
        this.rsvpStore.push({
            userId: "user-staff",
            eventId: "3",
            status: "going",
            id: "",
            createdAt: new Date(),
        });
    };

    async findByEvent(eventId: string): Promise<Result<IRSVPRecord[], RSVPError>> {
        const records = this.rsvpStore.filter(r => r.eventId === eventId)
        return Ok(records)
    }

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

    async create(userId: string, eventId: string, status: RSVPStatus): Promise<Result<IRSVPRecord, RSVPError>> {
        const record = {
            userId: userId,
            eventId: eventId,
            status: status,
            id: crypto.randomUUID(),
            createdAt: new Date()
        }
        this.rsvpStore.push(record)
        return Ok(record)
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
