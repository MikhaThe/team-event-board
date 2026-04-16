import { Ok, Err, type Result } from "../lib/result";
import { UnexpectedError, type EventError } from "./errors";
import type { IEventRepository } from "./EventRepository";
import type { IEvent } from "./Event";

export const SEED_EVENTS: IEvent[] = [
  {
    id: "event-1",
    title: "Team Kickoff Meeting",
    description: "Quarterly kickoff to align on goals and roadmap for the next sprint.",
    location: "Conference Room A",
    category: "Meeting",
    status: "draft",
    startDatetime: "2026-04-20T10:00:00.000Z",
    endDatetime: "2026-04-20T11:30:00.000Z",
    organizerId: "user-admin",
    createdAt: "2026-04-10T08:00:00.000Z",
    updatedAt: "2026-04-10T08:00:00.000Z",
  },
  {
    id: "event-2",
    title: "Spring Hackathon",
    description: "24-hour hackathon open to all engineers. Build something amazing.",
    location: "Main Hall",
    category: "Hackathon",
    status: "published",
    capacity: 50,
    startDatetime: "2026-05-02T09:00:00.000Z",
    endDatetime: "2026-05-03T09:00:00.000Z",
    organizerId: "user-admin",
    createdAt: "2026-04-10T08:30:00.000Z",
    updatedAt: "2026-04-10T08:30:00.000Z",
  },
  {
    id: "event-3",
    title: "UX Design Workshop",
    description: "Hands-on workshop covering user research, wireframing, and prototyping.",
    location: "Room 204",
    category: "Workshop",
    status: "published",
    capacity: 20,
    startDatetime: "2026-04-25T14:00:00.000Z",
    endDatetime: "2026-04-25T17:00:00.000Z",
    organizerId: "user-staff",
    createdAt: "2026-04-10T09:00:00.000Z",
    updatedAt: "2026-04-10T09:00:00.000Z",
  },
  {
    id: "event-4",
    title: "Annual Tech Conference",
    description: "Company-wide tech conference. Cancelled due to scheduling conflicts.",
    location: "Auditorium",
    category: "Conference",
    status: "cancelled",
    startDatetime: "2026-06-15T09:00:00.000Z",
    endDatetime: "2026-06-15T18:00:00.000Z",
    organizerId: "user-admin",
    createdAt: "2026-04-08T10:00:00.000Z",
    updatedAt: "2026-04-09T14:00:00.000Z",
  },
  {
    id: "event-5",
    title: "Design System Review",
    description: "Review and update the component library and design tokens.",
    location: "Room 101",
    category: "Meeting",
    status: "draft",
    startDatetime: "2026-04-22T13:00:00.000Z",
    endDatetime: "2026-04-22T14:30:00.000Z",
    organizerId: "user-staff",
    createdAt: "2026-04-10T10:00:00.000Z",
    updatedAt: "2026-04-10T10:00:00.000Z",
  },
];

class InMemoryEventRepository implements IEventRepository {
  constructor(private readonly events: IEvent[]) {}

  async findById(id: string): Promise<Result<IEvent | null, EventError>> {
    try {
      const match = this.events.find((e) => e.id === id) ?? null;
      return Ok(match);
    } catch {
      return Err(UnexpectedError("Unable to read events."));
    }
  }

  async findByOrganizerId(organizerId: string): Promise<Result<IEvent[], EventError>> {
    try {
      const matches = this.events.filter((e) => e.organizerId === organizerId);
      return Ok([...matches]);
    } catch {
      return Err(UnexpectedError("Unable to read events."));
    }
  }

  async update(event: IEvent): Promise<Result<IEvent, EventError>> {
    try {
      const index = this.events.findIndex((e) => e.id === event.id);
      if (index === -1) {
        return Err(UnexpectedError("Event not found during update."));
      }
      this.events[index] = event;
      return Ok(event);
    } catch {
      return Err(UnexpectedError("Unable to update event."));
    }
  }
}

export function CreateInMemoryEventRepository(): IEventRepository {
  return new InMemoryEventRepository([...SEED_EVENTS]);
}
