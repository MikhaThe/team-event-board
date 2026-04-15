import type { IRSVPRecord, RSVPStatus } from "./RSVP";


export interface IRSVPRepository {
    findByUserAndEvent(userId: string, eventId: string): IRSVPRecord | null;
    create(rsvp: IRSVPRecord): IRSVPRecord;
    updateStatus(userId: string, eventId: string, status: RSVPStatus): IRSVPRecord;
}

class RSVPRepository implements IRSVPRepository {
    constructor(private readonly rsvpStore: IRSVPRecord[]) {};

    findByUserAndEvent(userId: string, eventId: string): IRSVPRecord | null {
        const record = this.rsvpStore.find(r => r.userId == userId && r.eventId == eventId) ?? null
        return record
    }
    create(rsvp: IRSVPRecord): IRSVPRecord {
        this.rsvpStore.push(rsvp)
        return rsvp
    }
    updateStatus(userId: string, eventId: string, status: RSVPStatus): IRSVPRecord {
        const record = this.findByUserAndEvent(userId, eventId)

        if (record) {
            record.status = status;
        }
        return record!
    }
}

export function CreateRSVPRepository(): IRSVPRepository {
  return new RSVPRepository([]);
}