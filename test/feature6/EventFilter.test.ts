import request from "supertest";
import { createComposedApp } from "../../src/composition";

const app = createComposedApp('memory').getExpressApp();

async function loginAs(agent: request.Agent, email: string, password: string) {
  const res = await agent
    .post("/login")
    .type("form")
    .send({ email, password });

  if (res.status !== 302) {
    throw new Error(`Login failed for ${email}: status ${res.status}`);
  }
}

describe("Feature 6 - Category and Date Filter", () => {
  describe("Happy path", () => {
    it("returns 200 and all published events with no filters", async () => {
      const agent = request.agent(app);
      await loginAs(agent, "staff@app.test", "password123");

      const res = await agent.get("/events");
      expect(res.status).toBe(200);
      expect(res.text).toContain("Test Event");
      expect(res.text).toContain("Music Night");
    });

    it("returns only events matching the category filter", async () => {
      const agent = request.agent(app);
      await loginAs(agent, "staff@app.test", "password123");

      const res = await agent.get("/events?category=Music");
      expect(res.status).toBe(200);
      expect(res.text).toContain("Music Night");
      expect(res.text).not.toContain("Test Event");
    });

    it("returns only events matching the date filter", async () => {
      const agent = request.agent(app);
      await loginAs(agent, "staff@app.test", "password123");

      const res = await agent.get("/events?date=2026-04-22");
      expect(res.status).toBe(200);
      expect(res.text).toContain("Music Night");
      expect(res.text).not.toContain("Test Event");
    });

    it("returns events matching both category and date filters", async () => {
      const agent = request.agent(app);
      await loginAs(agent, "staff@app.test", "password123");

      const res = await agent.get("/events?category=Music&date=2026-04-22");
      expect(res.status).toBe(200);
      expect(res.text).toContain("Music Night");
    });
  });

  describe("Edge cases", () => {
    it("returns empty list when no events match the filter", async () => {
      const agent = request.agent(app);
      await loginAs(agent, "staff@app.test", "password123");

      const res = await agent.get("/events?category=NonExistentCategory");
      expect(res.status).toBe(200);
      expect(res.text).toContain("No matching published events found.");
    });

    it("does not return draft events even with no filters", async () => {
      const agent = request.agent(app);
      await loginAs(agent, "staff@app.test", "password123");

      const res = await agent.get("/events");
      expect(res.status).toBe(200);
      expect(res.text).not.toContain("Private Draft Event");
    });

    it("returns HTMX partial when HX-Request header is present", async () => {
      const agent = request.agent(app);
      await loginAs(agent, "staff@app.test", "password123");

      const res = await agent.get("/events?category=Music").set("HX-Request", "true");
      expect(res.status).toBe(200);
      expect(res.text).toContain("Music Night");
    });
  });
});