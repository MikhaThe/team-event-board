import { CreateDashboardService } from "../../src/dashboard/DashboardService";
import type { IEventRepository } from "../../src/event/EventRepository";
import { IRSVPRecord } from "../../src/rsvp/RSVP";
import type { IRSVPRepository } from "../../src/rsvp/RSVPRepository";
import type { Event } from "../../src/event/Event";

function makeEvent(overrides?: Partial<Event>): Event {
  return {
    id: "1",
    title: "Event",
    description: "desc",
    location: "A",
    category: "tech",
    status: "published",
    organizerId: "org1",
    organizerName: "Org One",
    startDatetime: new Date().toISOString(),
    endDatetime: new Date().toISOString(),
    attendeeCount: 0,
    ...overrides,
  };
}

function makeRSVP(overrides?: Partial<IRSVPRecord>): IRSVPRecord {
  return {
    id: "r1",
    userId: "u1",
    eventId: "1",
    status: "going",
    createdAt: new Date(),
    ...overrides,
  };
}

describe("DashboardService", () => {
  let rsvpRepo: jest.Mocked<IRSVPRepository>;
  let eventRepo: jest.Mocked<IEventRepository>;
  let service: ReturnType<typeof CreateDashboardService>;

  beforeEach(() => {
    rsvpRepo = {
      findByUser: jest.fn(),
    } as any;

    eventRepo = {
      findAll: jest.fn(),
    } as any;

    service = CreateDashboardService(rsvpRepo, eventRepo);
  });

  it("returns empty dashboard when user has no RSVPs", async () => {
    rsvpRepo.findByUser.mockResolvedValue({ ok: true, value: [] });

    const result = await service.getDashboard("user1");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({
        upcoming: [],
        past: [],
      });
    }

    expect(rsvpRepo.findByUser).toHaveBeenCalledWith("user1");
    expect(eventRepo.findAll).not.toHaveBeenCalled();
  });

  it("splits upcoming and past events correctly", async () => {
    const now = new Date();

    rsvpRepo.findByUser.mockResolvedValue({
        ok: true,
        value: [
            makeRSVP({ eventId: "1", status: "going" }),
            makeRSVP({ eventId: "2", status: "going" }),
            makeRSVP({ eventId: "3", status: "cancelled" }),
        ],
    });

    eventRepo.findAll.mockResolvedValue({
      ok: true,
      value: [
        makeEvent({
          id: "1",
          title: "Future Event",
          startDatetime: new Date(now.getTime() + 100000).toISOString(),
          endDatetime: new Date(now.getTime() + 200000).toISOString(),
          location: "A",
        }),     
        makeEvent({
          id: "2",
          title: "Past Event",
          startDatetime: new Date(now.getTime() - 200000).toISOString(),
          endDatetime: new Date(now.getTime() - 100000).toISOString(),
          location: "B",
        }),
        makeEvent({
          id: "3",
          title: "Cancelled Event",
          startDatetime: new Date(now.getTime() + 100000).toISOString(),
          endDatetime: new Date(now.getTime() + 200000).toISOString(),
          location: "C",
        }),
      ],
    });

    const result = await service.getDashboard("u1");

    expect(result.ok).toBe(true);

    if (result.ok) {
        expect(result.value.upcoming).toHaveLength(1);
        expect(result.value.past).toHaveLength(2);

        expect(result.value.upcoming[0].title).toBe("Future Event");
        expect(result.value.past.map(e => e.title)).toEqual(
            expect.arrayContaining(["Past Event", "Cancelled Event"])
        );
    };
});

  it("returns error when RSVP repo fails", async () => {
    rsvpRepo.findByUser.mockResolvedValue({
      ok: false,
      value: {
        name: "RSVPNotFound",
        message: "Database connection failed",
      },
    });

    const result = await service.getDashboard("u1");

    expect(result.ok).toBe(false);
  });

  it("returns error when event repo fails", async () => {
    rsvpRepo.findByUser.mockResolvedValue({
      ok: true,
      value: [makeRSVP()],
    });

    eventRepo.findAll.mockResolvedValue({
      ok: false,
      value: "Database connection failed",
    });

    const result = await service.getDashboard("u1");

    expect(result.ok).toBe(false);
  });
});