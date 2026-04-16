export type EventStatus = "draft" | "published" | "cancelled" | "past";
export type RsvpStatus = "going" | "waitlisted" | "cancelled";

export interface IEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  category: string;
  status: EventStatus;
  capacity?: number;
  startDatetime: string;
  endDatetime: string;
  organizerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface IRsvp {
  id: string;
  eventId: string;
  userId: string;
  status: RsvpStatus;
  createdAt: string;
}

export interface IEventWithCount extends IEvent {
  attendeeCount: number;
}

export interface IOrganizerDashboard {
  draft: IEventWithCount[];
  published: IEventWithCount[];
  cancelled: IEventWithCount[];
  past: IEventWithCount[];
}
