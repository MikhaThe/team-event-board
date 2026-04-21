export type EventStatus = "draft" | "published" | "cancelled" | "past";
export type RsvpStatus = "going" | "waitlisted" | "cancelled";
import { Event } from "../event/Event";

export interface IEventWithCount extends Event {
  attendeeCount: number;
}

export interface IOrganizerDashboard {
  draft: IEventWithCount[];
  published: IEventWithCount[];
  cancelled: IEventWithCount[];
  past: IEventWithCount[];
}
