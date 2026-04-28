export type RSVPStatus = "going" | "waitlisted" | "cancelled";

export interface IRSVPRecord {
  userId: string;
  eventId: string;
  status: RSVPStatus;
  id: string;
  createdAt: Date;
}