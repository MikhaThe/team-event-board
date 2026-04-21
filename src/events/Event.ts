export type EventStatus = "draft" | "published" | "cancelled" | "past";

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

export interface IEventWithCount extends IEvent {
  attendeeCount: number;
}

export interface IOrganizerDashboard {
  draft: IEventWithCount[];
  published: IEventWithCount[];
  cancelled: IEventWithCount[];
  past: IEventWithCount[];
}
