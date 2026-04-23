import request from "supertest";
import { createComposedApp } from "../../src/composition";
import { CreateOrganizerService } from "../../src/organizerdashboard/OrganizerService";
import { InMemoryEventRepository } from "../../src/event/EventRepository";
import { CreateRSVPRepository } from "../../src/rsvp/RSVPRepository";

// ─── HTTP helpers ────────────────────────────────────────────────────────────

function makeApp() {
  return createComposedApp().getExpressApp();
}

async function loginAs(agent: ReturnType<typeof request.agent>, email: string) {
  await agent.post("/login").type("form").send({ email, password: "password123" });
}

// ─── Service unit tests ───────────────────────────────────────────────────────

describe("OrganizerService.getOrganizerDashboard", () => {
  it("returns only the organizer's own events", async () => {
    const eventRepo = InMemoryEventRepository();
    const rsvpRepo = CreateRSVPRepository();
    const service = CreateOrganizerService(eventRepo, rsvpRepo);

    const result = await service.getOrganizerDashboard("user-staff");

    expect(result.ok).toBe(true);
    if (result.ok) {
      const allEvents = [
        ...result.value.draft,
        ...result.value.published,
        ...result.value.cancelled,
        ...result.value.past,
      ];
      expect(allEvents.length).toBeGreaterThan(0);
      for (const event of allEvents) {
        expect(event.organizerId).toBe("user-staff");
      }
    }
  });

  it("returns all events when viewAll is true (admin mode)", async () => {
    const eventRepo = InMemoryEventRepository();
    const rsvpRepo = CreateRSVPRepository();
    const service = CreateOrganizerService(eventRepo, rsvpRepo);

    const staffResult = await service.getOrganizerDashboard("user-staff");
    const adminResult = await service.getOrganizerDashboard("user-admin", true);

    expect(staffResult.ok).toBe(true);
    expect(adminResult.ok).toBe(true);

    if (staffResult.ok && adminResult.ok) {
      const staffTotal =
        staffResult.value.draft.length +
        staffResult.value.published.length +
        staffResult.value.cancelled.length +
        staffResult.value.past.length;

      const adminTotal =
        adminResult.value.draft.length +
        adminResult.value.published.length +
        adminResult.value.cancelled.length +
        adminResult.value.past.length;

      expect(adminTotal).toBeGreaterThan(staffTotal);
    }
  });

  it("groups events by status correctly", async () => {
    const eventRepo = InMemoryEventRepository();
    const rsvpRepo = CreateRSVPRepository();
    const service = CreateOrganizerService(eventRepo, rsvpRepo);

    const result = await service.getOrganizerDashboard("user-staff");

    expect(result.ok).toBe(true);
    if (result.ok) {
      for (const event of result.value.published) {
        expect(event.status).toBe("published");
      }
      for (const event of result.value.draft) {
        expect(event.status).toBe("draft");
      }
      for (const event of result.value.cancelled) {
        expect(event.status).toBe("cancelled");
      }
      for (const event of result.value.past) {
        expect(event.status).toBe("past");
      }
    }
  });

  it("includes accurate attendee counts", async () => {
    const eventRepo = InMemoryEventRepository();
    const rsvpRepo = CreateRSVPRepository();
    const service = CreateOrganizerService(eventRepo, rsvpRepo);

    const result = await service.getOrganizerDashboard("user-staff");

    expect(result.ok).toBe(true);
    if (result.ok) {
      const allEvents = [
        ...result.value.draft,
        ...result.value.published,
      ];
      for (const event of allEvents) {
        expect(typeof event.attendeeCount).toBe("number");
        expect(event.attendeeCount).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("returns an empty dashboard for an organizer with no events", async () => {
    const eventRepo = InMemoryEventRepository();
    const rsvpRepo = CreateRSVPRepository();
    const service = CreateOrganizerService(eventRepo, rsvpRepo);

    const result = await service.getOrganizerDashboard("user-reader");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.draft).toHaveLength(0);
      expect(result.value.published).toHaveLength(0);
      expect(result.value.cancelled).toHaveLength(0);
      expect(result.value.past).toHaveLength(0);
    }
  });
});

// ─── HTTP integration tests ───────────────────────────────────────────────────

describe("GET /organizer/dashboard", () => {
  it("returns 200 for a staff (organizer) user", async () => {
    const agent = request.agent(makeApp());
    await loginAs(agent, "staff@app.test");

    const res = await agent.get("/organizer/dashboard");

    expect(res.status).toBe(200);
  });

  it("returns 200 for an admin user", async () => {
    const agent = request.agent(makeApp());
    await loginAs(agent, "admin@app.test");

    const res = await agent.get("/organizer/dashboard");

    expect(res.status).toBe(200);
  });

  it("returns 403 for a member (user role)", async () => {
    const agent = request.agent(makeApp());
    await loginAs(agent, "user@app.test");

    const res = await agent.get("/organizer/dashboard");

    expect(res.status).toBe(403);
  });

  it("redirects to /login when unauthenticated", async () => {
    const res = await request(makeApp()).get("/organizer/dashboard");

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/login");
  });

  it("dashboard HTML contains only the organizer's own events", async () => {
    const agent = request.agent(makeApp());
    await loginAs(agent, "staff@app.test");

    const res = await agent.get("/organizer/dashboard");

    expect(res.status).toBe(200);
    expect(res.text).toContain("Test Event");
    expect(res.text).toContain("Private Draft Event");
    expect(res.text).not.toContain("Music Night"); // owned by admin
  });

  it("admin dashboard HTML contains all events across organizers", async () => {
    const agent = request.agent(makeApp());
    await loginAs(agent, "admin@app.test");

    const res = await agent.get("/organizer/dashboard");

    expect(res.status).toBe(200);
    expect(res.text).toContain("Test Event");
    expect(res.text).toContain("Music Night");
    expect(res.text).toContain("Private Draft Event");
  });
});
