import request from "supertest";
import express from "express";
import session from "express-session";
import bodyParser from "body-parser";

import { CreateEventController } from "../../src/event/EventController";
import type { IEventService } from "../../src/event/EventService";
import { Ok, Err } from "../../src/lib/result";

// ---- Mock logger ----
const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// ---- Fake session middleware ----
function mockAuthSession(role = "user", userId = "user1") {
  return (req: any, _res: any, next: any) => {
    req.session = {
      authenticatedUser: {
        userId,
        role,
        displayName: "Test User",
      },
    };
    next();
  };
}

jest.mock("../../src/session/AppSession", () => ({
  getAuthenticatedUser: jest.fn(() => ({
    userId: "user1",
    role: "user",
  })),
}));

describe("EventController - updateEvent ONLY", () => {
  let mockService: jest.Mocked<IEventService>;
  let app: express.Express;

  beforeEach(() => {
    mockService = {
      getEventDetail: jest.fn(),
      getFilteredEvents: jest.fn(),
      editEvent: jest.fn(),
      saveEvent: jest.fn(),
      searchEvents: jest.fn(),
    };

    const controller = CreateEventController(mockService, mockLogger as any);

    app = express();  
    app.use(express.json());
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use((req: any, _res, next) => {
        req.session = {}; // doesn't matter now
        next();
    });

    // ONLY route we care about
    app.post("/events/:id", (req, res) =>
      controller.updateEvent(req, res)
    );
  });

  // -------------------------------
  // ✅ SUCCESS
  // -------------------------------
  it("redirects to event page on successful edit", async () => {
    mockService.editEvent.mockResolvedValue(Ok(undefined));

    const res = await request(app)
      .post("/events/1")
      .send({ title: "Updated Title" });

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/events/1");

    expect(mockService.editEvent).toHaveBeenCalledWith(
      "1",
      expect.objectContaining({ title: "Updated Title" }),
      "user1",
      "user"
    );
  });

  // -------------------------------
  // ❌ FORBIDDEN
  // -------------------------------
  it("returns 403 if user is not allowed to edit", async () => {
    mockService.editEvent.mockResolvedValue(
      Err({ name: "Forbidden", message: "Not allowed" })
    );

    const res = await request(app)
      .post("/events/1")
      .send({ title: "Hack Attempt" });

    expect(res.status).toBe(403);
    expect(res.text).toContain("Not allowed");
  });

  // -------------------------------
  // ❌ NOT FOUND
  // -------------------------------
  it("returns 404 if event does not exist", async () => {
    mockService.editEvent.mockResolvedValue(
      Err({ name: "EventNotFound", message: "Event missing" })
    );

    const res = await request(app)
      .post("/events/1")
      .send({ title: "Update" });

    expect(res.status).toBe(404);
    expect(res.text).toContain("Event missing");
  });

  // -------------------------------
  // ⚠️ UNKNOWN ERROR
  // -------------------------------
  it("returns 400 for unexpected errors", async () => {
    mockService.editEvent.mockResolvedValue(
      Err({ name: "WeirdError", message: "???" } as any)
    );

    const res = await request(app)
      .post("/events/1")
      .send({ title: "Update" });

    expect(res.status).toBe(400);
  });
});
