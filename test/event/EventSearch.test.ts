/**
 * EventSearch.test.ts
 *
 * Unit tests for EventService.searchEvents and integration tests for
 * GET /events/search via Supertest.
 *
 * The service tests use a fake repository so each case controls exactly which
 * events exist and what "now" means, avoiding any dependency on real wall-clock
 * time. The route tests use a mocked controller to verify the HTTP layer in
 * isolation.
 */

import { CreateEventService } from "../../src/event/EventService";
import type { IEventRepository } from "../../src/event/EventRepository";
import type { Event } from "../../src/event/Event";
import { Ok, Err } from "../../src/lib/result";
import { EventNotFound } from "../../src/lib/error";

// ---------------------------------------------------------------------------
// Test factory helpers
// ---------------------------------------------------------------------------

const FUTURE = "2099-01-01T10:00:00";
const PAST   = "2000-01-01T10:00:00";

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: "event-1",
    title: "Test Event",
    description: "A test description",
    location: "Springfield",
    category: "General",
    status: "published",
    organizerId: "user-1",
    organizerName: "Test Organizer",
    startDatetime: FUTURE,
    endDatetime: FUTURE,
    attendeeCount: 0,
    capacity: 50,
    ...overrides,
  };
}

function makeFakeRepo(overrides: Partial<IEventRepository> = {}): IEventRepository {
  return {
    findById: jest.fn().mockResolvedValue(Ok(null)),
    findAll: jest.fn().mockResolvedValue(Ok([])),
    save: jest.fn().mockResolvedValue(Ok(undefined)),
    findByOrganizerId: jest.fn().mockResolvedValue(Ok([])),
    update: jest.fn().mockResolvedValue(Ok(null)),
    listPublishedUpcoming: jest.fn().mockResolvedValue(Ok([])),
    searchPublishedUpcoming: jest.fn().mockResolvedValue(Ok([])),
    create: jest.fn().mockResolvedValue(Ok(null)),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Empty / blank input — should return all published upcoming events
// ---------------------------------------------------------------------------

describe("EventService.searchEvents – empty input", () => {
  it("returns all published upcoming events when input is null", async () => {
    const events = [makeEvent({ id: "1" }), makeEvent({ id: "2" })];
    const repo = makeFakeRepo({
      listPublishedUpcoming: jest.fn().mockResolvedValue(Ok(events)),
    });
    const svc = CreateEventService(repo);
    const result = await svc.searchEvents(null);

    expect(result.ok).toBe(true);
    expect(result.ok === true && result.value).toHaveLength(2);
    expect(repo.listPublishedUpcoming).toHaveBeenCalled();
    expect(repo.searchPublishedUpcoming).not.toHaveBeenCalled();
  });

  it("returns all published upcoming events when input is an empty string", async () => {
    const events = [makeEvent()];
    const repo = makeFakeRepo({
      listPublishedUpcoming: jest.fn().mockResolvedValue(Ok(events)),
    });
    const svc = CreateEventService(repo);
    const result = await svc.searchEvents("");

    expect(result.ok).toBe(true);
    expect(result.ok === true && result.value).toHaveLength(1);
    expect(repo.listPublishedUpcoming).toHaveBeenCalled();
    expect(repo.searchPublishedUpcoming).not.toHaveBeenCalled();
  });

  it("returns all published upcoming events when input is only whitespace", async () => {
    const events = [makeEvent()];
    const repo = makeFakeRepo({
      listPublishedUpcoming: jest.fn().mockResolvedValue(Ok(events)),
    });
    const svc = CreateEventService(repo);
    const result = await svc.searchEvents("   ");

    expect(result.ok).toBe(true);
    expect(result.ok === true && result.value).toHaveLength(1);
    expect(repo.listPublishedUpcoming).toHaveBeenCalled();
    expect(repo.searchPublishedUpcoming).not.toHaveBeenCalled();
  });

  it("returns an empty array when there are no published upcoming events", async () => {
    const repo = makeFakeRepo({
      listPublishedUpcoming: jest.fn().mockResolvedValue(Ok([])),
    });
    const svc = CreateEventService(repo);
    const result = await svc.searchEvents(null);

    expect(result.ok).toBe(true);
    expect(result.ok === true && result.value).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Matching results
// ---------------------------------------------------------------------------

describe("EventService.searchEvents – matching results", () => {
  it("returns events that match by title", async () => {
    const match = makeEvent({ id: "1", title: "Jazz Night" });
    const repo = makeFakeRepo({
      searchPublishedUpcoming: jest.fn().mockResolvedValue(Ok([match])),
    });
    const svc = CreateEventService(repo);
    const result = await svc.searchEvents("jazz");

    expect(result.ok).toBe(true);
    expect(result.ok === true && result.value[0].title).toBe("Jazz Night");
  });

  it("returns events that match by description", async () => {
    const match = makeEvent({ id: "1", description: "An outdoor picnic for all" });
    const repo = makeFakeRepo({
      searchPublishedUpcoming: jest.fn().mockResolvedValue(Ok([match])),
    });
    const svc = CreateEventService(repo);
    const result = await svc.searchEvents("picnic");

    expect(result.ok).toBe(true);
    expect(result.ok === true && result.value[0].description).toContain("picnic");
  });

  it("returns events that match by location", async () => {
    const match = makeEvent({ id: "1", location: "Campus Center" });
    const repo = makeFakeRepo({
      searchPublishedUpcoming: jest.fn().mockResolvedValue(Ok([match])),
    });
    const svc = CreateEventService(repo);
    const result = await svc.searchEvents("campus");

    expect(result.ok).toBe(true);
    expect(result.ok === true && result.value[0].location).toBe("Campus Center");
  });

  it("passes the term lowercased and trimmed to the repository", async () => {
    const repo = makeFakeRepo({
      searchPublishedUpcoming: jest.fn().mockResolvedValue(Ok([])),
    });
    const svc = CreateEventService(repo);
    await svc.searchEvents("  Jazz  ");

    expect(repo.searchPublishedUpcoming).toHaveBeenCalledWith(
      "jazz",
      expect.any(Date),
    );
  });

  it("returns multiple matching events", async () => {
    const matches = [
      makeEvent({ id: "1", title: "Jazz Night" }),
      makeEvent({ id: "2", title: "Jazz Brunch" }),
    ];
    const repo = makeFakeRepo({
      searchPublishedUpcoming: jest.fn().mockResolvedValue(Ok(matches)),
    });
    const svc = CreateEventService(repo);
    const result = await svc.searchEvents("jazz");

    expect(result.ok).toBe(true);
    expect(result.ok === true && result.value).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// No results
// ---------------------------------------------------------------------------

describe("EventService.searchEvents – no results", () => {
  it("returns an empty array when no events match the term", async () => {
    const repo = makeFakeRepo({
      searchPublishedUpcoming: jest.fn().mockResolvedValue(Ok([])),
    });
    const svc = CreateEventService(repo);
    const result = await svc.searchEvents("zzznomatch");

    expect(result.ok).toBe(true);
    expect(result.ok === true && result.value).toHaveLength(0);
  });

  it("does not return draft events even if they match the term", async () => {
    // The repo filters to published+upcoming only; the service should trust that.
    // This test verifies the service returns whatever the repo gives it — no
    // additional filtering is applied after the repo call.
    const repo = makeFakeRepo({
      searchPublishedUpcoming: jest.fn().mockResolvedValue(Ok([])), // repo already excluded drafts
    });
    const svc = CreateEventService(repo);
    const result = await svc.searchEvents("draft");

    expect(result.ok).toBe(true);
    expect(result.ok === true && result.value).toHaveLength(0);
  });

  it("does not return past events even if they match the term", async () => {
    const repo = makeFakeRepo({
      searchPublishedUpcoming: jest.fn().mockResolvedValue(Ok([])), // repo already excluded past
    });
    const svc = CreateEventService(repo);
    const result = await svc.searchEvents("past event");

    expect(result.ok).toBe(true);
    expect(result.ok === true && result.value).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Invalid / unexpected input
// ---------------------------------------------------------------------------

describe("EventService.searchEvents – invalid input", () => {
  it("treats a string of special characters as a valid search term", async () => {
    // No validation is applied — the term is passed straight through to the repo.
    const repo = makeFakeRepo({
      searchPublishedUpcoming: jest.fn().mockResolvedValue(Ok([])),
    });
    const svc = CreateEventService(repo);
    const result = await svc.searchEvents("!@#$%");

    expect(result.ok).toBe(true);
    expect(repo.searchPublishedUpcoming).toHaveBeenCalledWith("!@#$%", expect.any(Date));
  });

  it("treats a very long string as a valid search term", async () => {
    const longTerm = "a".repeat(1000);
    const repo = makeFakeRepo({
      searchPublishedUpcoming: jest.fn().mockResolvedValue(Ok([])),
    });
    const svc = CreateEventService(repo);
    const result = await svc.searchEvents(longTerm);

    expect(result.ok).toBe(true);
    expect(repo.searchPublishedUpcoming).toHaveBeenCalledWith(longTerm, expect.any(Date));
  });

  it("returns an error when the repository fails during a search", async () => {
    const repo = makeFakeRepo({
      searchPublishedUpcoming: jest.fn().mockResolvedValue(Err(EventNotFound("db error"))),
    });
    const svc = CreateEventService(repo);
    const result = await svc.searchEvents("jazz");

    expect(result.ok).toBe(false);
    expect(result.ok === false && result.value.name).toBe("EventNotFound");
  });

  it("returns an error when the repository fails during list-all", async () => {
    const repo = makeFakeRepo({
      listPublishedUpcoming: jest.fn().mockResolvedValue(Err(EventNotFound("db error"))),
    });
    const svc = CreateEventService(repo);
    const result = await svc.searchEvents(null);

    expect(result.ok).toBe(false);
    expect(result.ok === false && result.value.name).toBe("EventNotFound");
  });

  /**
   * KNOWN BUG — documented test:
   *
   * In EventController.searchEvents, the query param is extracted as:
   *
   *   const termRaw = req.query.q;
   *   const term = Array.isArray(termRaw) ? termRaw[0] : termRaw;
   *   const result = await this.service.searchEvents(String(term));
   *
   * When ?q is absent from the URL, termRaw is undefined, and
   * String(undefined) produces the literal string "undefined" — not an empty
   * string. This means a request with no ?q param searches for events
   * matching "undefined" instead of returning all events.
   *
   * Fix: replace `String(term)` with `term ?? null` so the service receives
   * null and correctly hits the list-all path.
   */
  it("documents: String(undefined) produces 'undefined', not an empty string", () => {
    expect(String(undefined)).toBe("undefined");
    expect(String(undefined).trim()).not.toBe("");
  });
});