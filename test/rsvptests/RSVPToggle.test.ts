import { CreateRSVPService } from "../../src/rsvp/RSVPService";
import type { IRSVPRepository } from "../../src/rsvp/RSVPRepository";
import type { IRSVPRecord } from "../../src/rsvp/RSVP";
import { Ok, Err } from "../../src/lib/result";
import { RSVPNotFound, InvalidRSVP, UnexpectedRSVPError } from "../../src/lib/error";
import { IEventRepository } from "../../src/event/EventRepository";
import { type Event } from "../../src/event/Event"

function makeRecord(overrides: Partial<IRSVPRecord> = {}): IRSVPRecord {
  return {
    id: "rsvp-1",
    userId: "user-1",
    eventId: "event-1",
    status: "going",
    createdAt: new Date(),
    ...overrides,
  };
}

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id:"event-1",
    title:"Event",
    description: "This is an event",
    location: "Here",
    category: "General",
    status: "published",
    organizerId: "staff-1",
    organizerName: "Organizer",
    startDatetime: "Tomorrow 2 PM",
    endDatetime: "Tomorrow 5 PM",
    attendeeCount: 0,
    capacity: 1,
    ...overrides
  }
}

function makeFakeRSVPRepo(overrides: Partial<IRSVPRepository> = {}): IRSVPRepository {
  return {
    findByEvent: jest.fn().mockResolvedValue(Ok([])),
    findByUser: jest.fn().mockResolvedValue(Ok([])),
    findByUserAndEvent: jest.fn().mockResolvedValue(Ok(null)),
    countGoingByEvent: jest.fn().mockResolvedValue(Ok(0)),
    create: jest.fn().mockResolvedValue(Ok(makeRecord())),
    updateStatus: jest.fn().mockResolvedValue(Ok(makeRecord())),
    ...overrides,
  };
}

function makeFakeEventRepo(overrides: Partial<IEventRepository> = {}): IEventRepository {
  return {
    findById: jest.fn().mockResolvedValue(Ok([])),
    findAll: jest.fn().mockResolvedValue(Ok([])),
    save: jest.fn().mockResolvedValue(Ok(makeEvent())),
    listPublishedUpcoming: jest.fn().mockResolvedValue(Ok([])),
    searchPublishedUpcoming: jest.fn().mockResolvedValue(Ok([])),
    findByOrganizerId: jest.fn().mockResolvedValue(Ok([])),
    update: jest.fn().mockResolvedValue(Ok(makeEvent())),
    create: jest.fn().mockResolvedValue(Ok(makeEvent())),
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Input validation
// ---------------------------------------------------------------------------

describe("RSVPService: input validation", () => {
  it("returns InvalidRSVP when userId is empty", async () => {
    const svc = CreateRSVPService(makeFakeRSVPRepo(), makeFakeEventRepo());
    const result = await svc.toggleRSVP({ userId: "", eventId: "event-1"});

    expect(result.ok).toBe(false);
    expect(result.ok === false && result.value.name).toBe("Invalid RSVP");
  });

  it("returns InvalidRSVP when userId is only whitespace", async () => {
    const svc = CreateRSVPService(makeFakeRSVPRepo(), makeFakeEventRepo());
    const result = await svc.toggleRSVP({ userId: "   ", eventId: "event-1"});

    expect(result.ok).toBe(false);
    expect(result.ok === false && result.value.name).toBe("Invalid RSVP");
  });

  it("returns InvalidRSVP when eventId is empty", async () => {
    const svc = CreateRSVPService(makeFakeRSVPRepo(), makeFakeEventRepo());
    const result = await svc.toggleRSVP({ userId: "user-1", eventId: ""});

    expect(result.ok).toBe(false);
    expect(result.ok === false && result.value.name).toBe("Invalid RSVP");
  });

  it("returns InvalidRSVP when capacity is negative", async () => {
    const eventRepo = makeFakeEventRepo({
      findById: jest.fn().mockResolvedValue(Ok(makeEvent({capacity: -1}))),
    });
    const svc = CreateRSVPService(makeFakeRSVPRepo(), makeFakeEventRepo());
    const result = await svc.toggleRSVP({ userId: "user-1", eventId: "event-1"});

    expect(result.ok).toBe(false);
    expect(result.ok === false && result.value.name).toBe("Invalid RSVP");
  });

  it("passes validation when capacity is exactly 0", async () => {
    // capacity === 0 is valid input; it means the event has no capacity
    // so any new RSVP lands on going
    const event = makeEvent({ attendeeCount: 0, capacity: 0 });
    const rsvpRepo = makeFakeRSVPRepo({
      findByUserAndEvent: jest.fn().mockResolvedValue(Ok(null)),
      countGoingByEvent: jest.fn().mockResolvedValue(Ok(0)),
      create: jest.fn().mockResolvedValue(Ok(makeRecord({ status: "going" }))),
    });
    const eventRepo = makeFakeEventRepo({
      findById: jest.fn().mockResolvedValue(Ok(event)),
      update: jest.fn().mockResolvedValue(Ok(event))
    })
    const svc = CreateRSVPService(rsvpRepo, eventRepo);
    const result = await svc.toggleRSVP({ userId: "user-1", eventId: "event-1"});

    // Validation itself must not reject capacity === 0
    expect(result.ok === false && result.value.name).toBe("Invalid RSVP");
  });
});

// ---------------------------------------------------------------------------
// New RSVP — no existing record (existingResult.value === null)
// ---------------------------------------------------------------------------

describe("RSVPService: new RSVP", () => {
  it("creates a 'going' RSVP when capacity has not been reached", async () => {
    const created = makeRecord({ status: "going" });
    const event = makeEvent({ capacity: 10, attendeeCount: 3 });
    const rsvpRepo = makeFakeRSVPRepo({
      findByUserAndEvent: jest.fn().mockResolvedValue(Ok(null)), // no prior RSVP
      countGoingByEvent: jest.fn().mockResolvedValue(Ok(3)),     // 3 going, capacity 10
      create: jest.fn().mockResolvedValue(Ok(created)),
    });
    const eventRepo = makeFakeEventRepo({
      findById: jest.fn().mockResolvedValue(Ok(event)),
      update: jest.fn().mockResolvedValue(Ok(event)),
    });
    const svc = CreateRSVPService(rsvpRepo, eventRepo);
    const result = await svc.toggleRSVP({ userId: "user-1", eventId: "event-1"});

    expect(result.ok).toBe(true);
    expect(result.ok === true && result.value.rsvp.status).toBe("going");
    expect(rsvpRepo.create).toHaveBeenCalledWith("user-1", "event-1", "going");
  });

  it("creates a 'waitlisted' RSVP when the event is at capacity", async () => {
    const created = makeRecord({ status: "waitlisted" });
    const event = makeEvent({ capacity: 10, attendeeCount: 10 });
    const rsvpRepo = makeFakeRSVPRepo({
      findByUserAndEvent: jest.fn().mockResolvedValue(Ok(null)), // no prior RSVP
      countGoingByEvent: jest.fn().mockResolvedValue(Ok(10)),    // 10 going, capacity 10
      create: jest.fn().mockResolvedValue(Ok(created)),
    });
    const eventRepo = makeFakeEventRepo({
      findById: jest.fn().mockResolvedValue(Ok(event)),
      update: jest.fn().mockResolvedValue(Ok(event)),
    });
    const svc = CreateRSVPService(rsvpRepo, eventRepo);
    const result = await svc.toggleRSVP({ userId: "user-1", eventId: "event-1"});

    expect(result.ok).toBe(true);
    expect(result.ok === true && result.value.rsvp.status).toBe("waitlisted");
    expect(rsvpRepo.create).toHaveBeenCalledWith("user-1", "event-1", "waitlisted");
  });

  it("creates a 'going' RSVP when there is exactly one slot left", async () => {
   const created = makeRecord({ status: "going" });
    const event = makeEvent({ capacity: 10, attendeeCount: 8 });
    const rsvpRepo = makeFakeRSVPRepo({
      findByUserAndEvent: jest.fn().mockResolvedValue(Ok(null)), // no prior RSVP
      countGoingByEvent: jest.fn().mockResolvedValue(Ok(10)),    // 10 going, capacity 10
      create: jest.fn().mockResolvedValue(Ok(created)),
    });
    const eventRepo = makeFakeEventRepo({
      findById: jest.fn().mockResolvedValue(Ok(event)),
      update: jest.fn().mockResolvedValue(Ok(event)),
    });
    const svc = CreateRSVPService(rsvpRepo, eventRepo);
    const result = await svc.toggleRSVP({ userId: "user-1", eventId: "event-1"});

    expect(result.ok).toBe(true);
    expect(result.ok === true && result.value.rsvp.status).toBe("going");
    expect(rsvpRepo.create).toHaveBeenCalledWith("user-1", "event-1", "going");
  });
});

// ---------------------------------------------------------------------------
// Cancel — existing 'going' or 'waitlisted' RSVP
// ---------------------------------------------------------------------------

describe("RSVPService: cancelling an existing RSVP", () => {
  it("cancels a 'going' RSVP", async () => {
    const existing = makeRecord({ status: "going" });
    const cancelled = makeRecord({ status: "cancelled" });
    const event = makeEvent({ capacity: 10, attendeeCount: 5 });
    const rsvpRepo = makeFakeRSVPRepo({
      findByUserAndEvent: jest.fn().mockResolvedValue(Ok(existing)),
      countGoingByEvent: jest.fn().mockResolvedValue(Ok(5)),
      updateStatus: jest.fn().mockResolvedValue(Ok(cancelled)),
    });
    const eventRepo = makeFakeEventRepo({
      findById: jest.fn().mockResolvedValue(Ok(event)),
      update: jest.fn().mockResolvedValue(Ok(event)),
    });
    const svc = CreateRSVPService(rsvpRepo, eventRepo);
    const result = await svc.toggleRSVP({ userId: "user-1", eventId: "event-1"});

    expect(result.ok).toBe(true);
    expect(result.ok === true && result.value.rsvp.status).toBe("cancelled");
    expect(rsvpRepo.updateStatus).toHaveBeenCalledWith("user-1", "event-1", "cancelled");
  });

  it("cancels a 'waitlisted' RSVP", async () => {
    const existing = makeRecord({ status: "waitlisted" });
    const cancelled = makeRecord({ status: "cancelled" });
    const event = makeEvent({ capacity: 10, attendeeCount: 10 });
    const rsvpRepo = makeFakeRSVPRepo({
      findByUserAndEvent: jest.fn().mockResolvedValue(Ok(existing)),
      countGoingByEvent: jest.fn().mockResolvedValue(Ok(10)),
      updateStatus: jest.fn().mockResolvedValue(Ok(cancelled)),
    });
    const eventRepo = makeFakeEventRepo({
      findById: jest.fn().mockResolvedValue(Ok(event)),
      update: jest.fn().mockResolvedValue(Ok(event)),
    });
    const svc = CreateRSVPService(rsvpRepo, eventRepo);
    const result = await svc.toggleRSVP({ userId: "user-1", eventId: "event-1"});

    expect(result.ok).toBe(true);
    expect(result.ok === true && result.value.rsvp.status).toBe("cancelled");
    expect(rsvpRepo.updateStatus).toHaveBeenCalledWith("user-1", "event-1", "cancelled");
  });

  it("returns an error if updateStatus fails during cancellation", async () => {
    const existing = makeRecord({ status: "going" });
    const event = makeEvent({ capacity: 10, attendeeCount: 5 });
    const rsvpRepo = makeFakeRSVPRepo({
      findByUserAndEvent: jest.fn().mockResolvedValue(Ok(existing)),
      countGoingByEvent: jest.fn().mockResolvedValue(Ok(5)),
      updateStatus: jest.fn().mockResolvedValue(Err(RSVPNotFound("not found"))),
    });
     const eventRepo = makeFakeEventRepo({
      findById: jest.fn().mockResolvedValue(Ok(event)),
      update: jest.fn().mockResolvedValue(Ok(event)),
    });
    const svc = CreateRSVPService(rsvpRepo, eventRepo);
    const result = await svc.toggleRSVP({ userId: "user-1", eventId: "event-1"});

    expect(result.ok).toBe(false);
    expect(result.ok === false && result.value.name).toBe("RSVP Not Found");
  });
});

// ---------------------------------------------------------------------------
// Reactivate — existing 'cancelled' RSVP
// ---------------------------------------------------------------------------

describe("RSVPService: reactivating a cancelled RSVP", () => {
  it("reactivates to 'going' when capacity has not been reached", async () => {
    const existing = makeRecord({ status: "cancelled" });
    const reactivated = makeRecord({ status: "going" });
    const event = makeEvent({ capacity: 10, attendeeCount: 3 });
    const rsvpRepo = makeFakeRSVPRepo({
      findByUserAndEvent: jest.fn().mockResolvedValue(Ok(existing)),
      countGoingByEvent: jest.fn().mockResolvedValue(Ok(3)), // 3 of 10 taken
      updateStatus: jest.fn().mockResolvedValue(Ok(reactivated)),
    });
     const eventRepo = makeFakeEventRepo({
      findById: jest.fn().mockResolvedValue(Ok(event)),
      update: jest.fn().mockResolvedValue(Ok(event)),
    });
    const svc = CreateRSVPService(rsvpRepo, eventRepo);
    const result = await svc.toggleRSVP({ userId: "user-1", eventId: "event-1"});

    expect(result.ok).toBe(true);
    expect(result.ok === true && result.value.rsvp.status).toBe("going");
    expect(rsvpRepo.updateStatus).toHaveBeenCalledWith("user-1", "event-1", "going");
  });

  it("reactivates to 'waitlisted' when the event is at capacity", async () => {
    const existing = makeRecord({ status: "cancelled" });
    const reactivated = makeRecord({ status: "waitlisted" });
    const event = makeEvent({ capacity: 10, attendeeCount: 10 });
    const rsvpRepo = makeFakeRSVPRepo({
      findByUserAndEvent: jest.fn().mockResolvedValue(Ok(existing)),
      countGoingByEvent: jest.fn().mockResolvedValue(Ok(3)), // 3 of 10 taken
      updateStatus: jest.fn().mockResolvedValue(Ok(reactivated)),
    });
     const eventRepo = makeFakeEventRepo({
      findById: jest.fn().mockResolvedValue(Ok(event)),
      update: jest.fn().mockResolvedValue(Ok(event)),
    });
    const svc = CreateRSVPService(rsvpRepo, eventRepo);
    const result = await svc.toggleRSVP({ userId: "user-1", eventId: "event-1"});

    expect(result.ok).toBe(true);
    expect(result.ok === true && result.value.rsvp.status).toBe("waitlisted");
    expect(rsvpRepo.updateStatus).toHaveBeenCalledWith("user-1", "event-1", "waitlisted");
  });

  it("returns an error if updateStatus fails during reactivation", async () => {
    const existing = makeRecord({ status: "cancelled" });
    const event = makeEvent({ capacity: 10, attendeeCount: 3 });
    const rsvpRepo = makeFakeRSVPRepo({
      findByUserAndEvent: jest.fn().mockResolvedValue(Ok(existing)),
      countGoingByEvent: jest.fn().mockResolvedValue(Ok(3)),
      updateStatus: jest.fn().mockResolvedValue(Err(RSVPNotFound("not found"))),
    });
    const eventRepo = makeFakeEventRepo({
      findById: jest.fn().mockResolvedValue(Ok(event)),
      update: jest.fn().mockResolvedValue(Ok(event)),
    });
    const svc = CreateRSVPService(rsvpRepo, eventRepo);
    const result = await svc.toggleRSVP({ userId: "user-1", eventId: "event-1"});

    expect(result.ok).toBe(false);
    expect(result.ok === false && result.value.name).toBe("RSVP Not Found");
  });
});

// ---------------------------------------------------------------------------
// Capacity boundary — precise edge cases
// ---------------------------------------------------------------------------

describe("RSVPService: capacity boundary (goingCount vs capacity)", () => {
  // The condition is: goingCount < capacity → "going", otherwise → "waitlisted"

  it("goes when attendeeCount is strictly less than capacity (new RSVP)", async () => {
    const event = makeEvent({ capacity: 5, attendeeCount: 4 });
    const rsvpRepo = makeFakeRSVPRepo({
      findByUserAndEvent: jest.fn().mockResolvedValue(Ok(null)),
      countGoingByEvent: jest.fn().mockResolvedValue(Ok(4)),
      create: jest.fn().mockResolvedValue(Ok(makeRecord({ status: "going" }))),
    });
    const eventRepo = makeFakeEventRepo({
      findById: jest.fn().mockResolvedValue(Ok(event)),
      update: jest.fn().mockResolvedValue(Ok(event)),
    });
    const svc = CreateRSVPService(rsvpRepo, eventRepo);
    const result = await svc.toggleRSVP({ userId: "user-1", eventId: "event-1" });

    expect(rsvpRepo.create).toHaveBeenCalledWith("user-1", "event-1", "going");
    expect(result.ok === true && result.value.rsvp.status).toBe("going");
  });

  it("waitlists when attendeeCount equals capacity (new RSVP)", async () => {
    const event = makeEvent({ capacity: 5, attendeeCount: 5 });
    const rsvpRepo = makeFakeRSVPRepo({
      findByUserAndEvent: jest.fn().mockResolvedValue(Ok(null)),
      countGoingByEvent: jest.fn().mockResolvedValue(Ok(5)),
      create: jest.fn().mockResolvedValue(Ok(makeRecord({ status: "waitlisted" }))),
    });
    const eventRepo = makeFakeEventRepo({
      findById: jest.fn().mockResolvedValue(Ok(event)),
      update: jest.fn().mockResolvedValue(Ok(event)),
    });
    const svc = CreateRSVPService(rsvpRepo, eventRepo);
    const result = await svc.toggleRSVP({ userId: "user-1", eventId: "event-1" });

    expect(rsvpRepo.create).toHaveBeenCalledWith("user-1", "event-1", "waitlisted");
    expect(result.ok === true && result.value.rsvp.status).toBe("waitlisted");
  });

  it("waitlists when attendeeCount exceeds capacity (new RSVP)", async () => {
    const event = makeEvent({ capacity: 5, attendeeCount: 7 });
    const rsvpRepo = makeFakeRSVPRepo({
      findByUserAndEvent: jest.fn().mockResolvedValue(Ok(null)),
      countGoingByEvent: jest.fn().mockResolvedValue(Ok(5)),
      create: jest.fn().mockResolvedValue(Ok(makeRecord({ status: "waitlisted" }))),
    });
    const eventRepo = makeFakeEventRepo({
      findById: jest.fn().mockResolvedValue(Ok(event)),
      update: jest.fn().mockResolvedValue(Ok(event)),
    });
    const svc = CreateRSVPService(rsvpRepo, eventRepo);
    const result = await svc.toggleRSVP({ userId: "user-1", eventId: "event-1" });

    expect(rsvpRepo.create).toHaveBeenCalledWith("user-1", "event-1", "waitlisted");
    expect(result.ok === true && result.value.rsvp.status).toBe("waitlisted");
  });

  it("goes when attendeeCount is strictly less than capacity (reactivation)", async () => {
    const event = makeEvent({ capacity: 5, attendeeCount: 4 });
    const repo = makeFakeRSVPRepo({
      findByUserAndEvent: jest.fn().mockResolvedValue(Ok(makeRecord({ status: "cancelled" }))),
      countGoingByEvent: jest.fn().mockResolvedValue(Ok(4)),
      updateStatus: jest.fn().mockResolvedValue(Ok(makeRecord({ status: "going" }))),
    });
    const eventRepo = makeFakeEventRepo({
      findById: jest.fn().mockResolvedValue(Ok(event)),
      update: jest.fn().mockResolvedValue(Ok(event)),
    });
    const svc = CreateRSVPService(repo, eventRepo);
    const result = await svc.toggleRSVP({ userId: "user-1", eventId: "event-1" });

    expect(repo.updateStatus).toHaveBeenCalledWith("user-1", "event-1", "going");
  });

  it("waitlists when attendeeCount equals capacity (reactivation)", async () => {
    const event = makeEvent({ capacity: 5, attendeeCount: 5 });
    const repo = makeFakeRSVPRepo({
      findByUserAndEvent: jest.fn().mockResolvedValue(Ok(makeRecord({ status: "cancelled" }))),
      countGoingByEvent: jest.fn().mockResolvedValue(Ok(5)),
      updateStatus: jest.fn().mockResolvedValue(Ok(makeRecord({ status: "waitlisted" }))),
    });
    const eventRepo = makeFakeEventRepo({
      findById: jest.fn().mockResolvedValue(Ok(event)),
      update: jest.fn().mockResolvedValue(Ok(event)),
    });
    const svc = CreateRSVPService(repo, eventRepo);
    const result = await svc.toggleRSVP({ userId: "user-1", eventId: "event-1" });

    expect(repo.updateStatus).toHaveBeenCalledWith("user-1", "event-1", "waitlisted");
  });
});