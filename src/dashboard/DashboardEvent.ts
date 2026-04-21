import type { RSVPStatus } from "../rsvp/RSVP";


export interface IDashboardEvent {
  eventId: string;
  title: string;
  startDatetime: string;
  endDatetime: string;
  location: string;
  status: RSVPStatus;
}

export interface IDashboardView {
  upcoming: IDashboardEvent[]; // "going" | "waitlisted", startDatetime asc
  past: IDashboardEvent[];     // "cancelled" + elapsed, startDatetime desc
}