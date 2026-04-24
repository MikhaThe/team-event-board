import request from "supertest";
import { createComposedApp } from "../../src/composition";

const app = createComposedApp().getExpressApp();

async function loginAs(agent: request.Agent, email: string, password: string) {
  const res = await agent
    .post("/login")
    .type("form")
    .send({ email, password });

  if (res.status !== 302) {
    throw new Error(`Login failed for ${email}: status ${res.status}`);
  }
}

describe("Feature 2 - Event Detail Page", () => {
  describe("Happy path", () => {
    it("returns 200 and event details for a published event", async () => {
      const agent = request.agent(app);
      await loginAs(agent, "staff@app.test", "password123");

      const res = await agent.get("/events/1");
      expect(res.status).toBe(200);
      expect(res.text).toContain("Test Event");
    });
  });

  describe("EventNotFound error", () => {
    it("returns 404 when event does not exist", async () => {
      const agent = request.agent(app);
      await loginAs(agent, "staff@app.test", "password123");

      const res = await agent.get("/events/nonexistent-id");
      expect(res.status).toBe(404);
    });
  });

  describe("Forbidden error", () => {
    it("returns 403 when a regular user tries to view a draft event", async () => {
      const agent = request.agent(app);
      await loginAs(agent, "user@app.test", "password123");

      const res = await agent.get("/events/3");
      expect(res.status).toBe(403);
    });

    it("returns 200 when the organizer views their own draft event", async () => {
      const agent = request.agent(app);
      await loginAs(agent, "staff@app.test", "password123");

      const res = await agent.get("/events/3");
      expect(res.status).toBe(200);
    });

    it("returns 200 when an admin views a draft event", async () => {
      const agent = request.agent(app);
      await loginAs(agent, "admin@app.test", "password123");

      const res = await agent.get("/events/3");
      expect(res.status).toBe(200);
    });
  });
});