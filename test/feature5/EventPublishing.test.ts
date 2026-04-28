import request from "supertest";
import { createComposedApp } from "../../src/composition";
import { CreateEventService } from "../../src/event/EventService";
import { InMemoryEventRepository } from "../../src/event/EventRepository";

// ─── HTTP helpers ────────────────────────────────────────────────────────────

function makeApp() {
  return createComposedApp().getExpressApp();
}

async function loginAs(agent: ReturnType<typeof request.agent>, email: string) {
  await agent.post("/login").type("form").send({ email, password: "password123" });
}

// ─── Service unit tests ───────────────────────────────────────────────────────

describe("EventService.publishEvent", () => {
  it("publishes a draft event owned by the organizer", async () => {
    const repo = InMemoryEventRepository();
    const service = CreateEventService(repo);

    const result = await service.publishEvent("3", "user-staff");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe("published");
      expect(result.value.id).toBe("3");
    }
  });

  it("returns EventNotFound for a non-existent event", async () => {
    const repo = InMemoryEventRepository();
    const service = CreateEventService(repo);

    const result = await service.publishEvent("999", "user-staff");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.value.name).toBe("EventNotFound");
    }
  });

  it("returns Forbidden when a different organizer tries to publish", async () => {
    const repo = InMemoryEventRepository();
    const service = CreateEventService(repo);

    const result = await service.publishEvent("3", "user-reader");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.value.name).toBe("Forbidden");
    }
  });

  it("returns InvalidTransition when publishing an already-published event", async () => {
    const repo = InMemoryEventRepository();
    const service = CreateEventService(repo);

    const result = await service.publishEvent("1", "user-staff");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.value.name).toBe("InvalidTransition");
    }
  });

  it("allows an admin to publish any event", async () => {
    const repo = InMemoryEventRepository();
    const service = CreateEventService(repo);

    const result = await service.publishEvent("3", "user-admin", true);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe("published");
    }
  });
});

describe("EventService.cancelEvent", () => {
  it("cancels a published event owned by the organizer", async () => {
    const repo = InMemoryEventRepository();
    const service = CreateEventService(repo);

    const result = await service.cancelEvent("1", "user-staff");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe("cancelled");
    }
  });

  it("returns EventNotFound for a non-existent event", async () => {
    const repo = InMemoryEventRepository();
    const service = CreateEventService(repo);

    const result = await service.cancelEvent("999", "user-staff");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.value.name).toBe("EventNotFound");
    }
  });

  it("returns Forbidden when a different organizer tries to cancel", async () => {
    const repo = InMemoryEventRepository();
    const service = CreateEventService(repo);

    const result = await service.cancelEvent("1", "user-reader");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.value.name).toBe("Forbidden");
    }
  });

  it("returns InvalidTransition when cancelling a draft event", async () => {
    const repo = InMemoryEventRepository();
    const service = CreateEventService(repo);

    const result = await service.cancelEvent("3", "user-staff");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.value.name).toBe("InvalidTransition");
    }
  });

  it("returns InvalidTransition when cancelling an already-cancelled event", async () => {
    const repo = InMemoryEventRepository();
    const service = CreateEventService(repo);

    await service.cancelEvent("1", "user-staff");
    const result = await service.cancelEvent("1", "user-staff");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.value.name).toBe("InvalidTransition");
    }
  });

  it("allows an admin to cancel any event regardless of organizer", async () => {
    const repo = InMemoryEventRepository();
    const service = CreateEventService(repo);

    const result = await service.cancelEvent("1", "user-admin", true);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe("cancelled");
    }
  });
});

// ─── HTTP integration tests ───────────────────────────────────────────────────

describe("POST /events/:id/publish", () => {
  it("redirects to dashboard on successful publish (staff organizer)", async () => {
    const agent = request.agent(makeApp());
    await loginAs(agent, "staff@app.test");

    const res = await agent.post("/events/3/publish");

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/organizer/dashboard");
  });

  it("returns 403 when a non-owner tries to publish", async () => {
    const agent = request.agent(makeApp());
    await loginAs(agent, "staff@app.test");

    // event 2 is owned by user-admin, not user-staff
    const res = await agent.post("/events/2/publish");

    expect(res.status).toBe(403);
  });

  it("returns 401 when unauthenticated (POST requests are not redirected)", async () => {
    const res = await request(makeApp()).post("/events/3/publish");

    expect(res.status).toBe(401);
  });

  it("returns 409 when publishing an already-published event", async () => {
    const agent = request.agent(makeApp());
    await loginAs(agent, "staff@app.test");

    const res = await agent.post("/events/1/publish");

    expect(res.status).toBe(409);
  });

  it("returns 404 for a non-existent event", async () => {
    const agent = request.agent(makeApp());
    await loginAs(agent, "staff@app.test");

    const res = await agent.post("/events/999/publish");

    expect(res.status).toBe(404);
  });
});

describe("POST /events/:id/cancel", () => {
  it("redirects to dashboard on successful cancel (staff organizer)", async () => {
    const agent = request.agent(makeApp());
    await loginAs(agent, "staff@app.test");

    const res = await agent.post("/events/1/cancel");

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/organizer/dashboard");
  });

  it("returns 403 when a non-owner tries to cancel", async () => {
    const agent = request.agent(makeApp());
    await loginAs(agent, "staff@app.test");

    // event 2 is owned by user-admin
    const res = await agent.post("/events/2/cancel");

    expect(res.status).toBe(403);
  });

  it("returns 409 when cancelling a draft event", async () => {
    const agent = request.agent(makeApp());
    await loginAs(agent, "staff@app.test");

    const res = await agent.post("/events/3/cancel");

    expect(res.status).toBe(409);
  });

  it("admin can cancel any event regardless of organizer", async () => {
    const agent = request.agent(makeApp());
    await loginAs(agent, "admin@app.test");

    // event 1 is owned by user-staff, admin can still cancel it
    const res = await agent.post("/events/1/cancel");

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/organizer/dashboard");
  });
});
