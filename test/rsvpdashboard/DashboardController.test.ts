import request from "supertest";
import express from "express";
import { CreateDashboardController } from "../../src/dashboard/DashboardController";

describe("DashboardController (Supertest)", () => {
  const createApp = (sessionUser: any = null, serviceMock?: any) => {
    const service =
      serviceMock ?? {
        getDashboard: jest.fn(),
      };

    const logger = {
      warn: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
    };

    const controller = CreateDashboardController(service, logger);

    const app = express();

    app.use((req: any, _res, next) => {
      req.session = {
        app: {
          browserId: "test",
          browserLabel: "test",
          visitCount: 0,
          createdAt: new Date(),
          lastSeenAt: new Date(),
          authenticatedUser: sessionUser,
        },
      };
      next();
    });

    app.use((req, res: any, next) => {
        res.render = (_view: string, _locals: any) => res.status(200).end();
        next();
    });

    app.get("/dashboard", (req, res) =>
      controller.getDashboard(req, res)
    );

    return { app, service };
  };

  it("returns dashboard for authenticated user", async () => {
    const serviceMock = {
      getDashboard: jest.fn().mockResolvedValue({
        ok: true,
        value: { upcoming: [], past: [] },
      }),
    };

    const { app, service } = createApp(
      { userId: "u1", role: "user" },
      serviceMock
    );

    const res = await request(app).get("/dashboard");

    expect(res.status).toBe(200);
    expect(service.getDashboard).toHaveBeenCalledWith("u1", "user");
  });

  it("redirects when not authenticated", async () => {
    const { app } = createApp(null);

    const res = await request(app).get("/dashboard");

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/login");
  });

  it("blocks staff", async () => {
    const serviceMock = {
      getDashboard: jest.fn().mockResolvedValue({
        ok: false,
        value: {
          name: "UnexpectedDependencyError",
          message: "Staff members cannot access the dashboard."
        }
      })
    };

    const {app}= createApp({ userId: "s1", role: "staff" }, serviceMock);

    const res = await request(app).get("/dashboard");

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("/staff/events");
  });

  it("handles service failure", async () => {
    const serviceMock = {
      getDashboard: jest.fn().mockResolvedValue({
        ok: false,
        value: {
          name: "UnexpectedDependencyError",
          message: "DB error",
        },
      }),
    };

    const { app } = createApp(
      { userId: "u1", role: "user" },
      serviceMock
    );

    const res = await request(app).get("/dashboard");

    expect(res.status).toBe(500);
    expect(res.headers.location).toBe(
      "/?error=dashboard_unavailable"
    );
  });
});