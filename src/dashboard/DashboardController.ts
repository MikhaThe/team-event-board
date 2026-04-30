import type { Request, Response } from "express";
import type { IDashboardService } from "./DashboardService";
import type { ILoggingService } from "../service/LoggingService";
import type { IAppBrowserSession } from "../session/AppSession";
import { get } from "node:http";
import { getAuthenticatedUser } from "../session/AppSession";
import session from "express-session";
import { UnexpectedDependencyError } from "../auth/errors";

export interface IDashboardController {
  getDashboard(
    req: Request,
    res: Response
  ): Promise<void>;
}

class DashboardController implements IDashboardController {
  constructor(
    private readonly service: IDashboardService,
    private readonly logger: ILoggingService,
  ) {}

  async getDashboard(req: Request, res: Response): Promise<void> {
    const user = getAuthenticatedUser(req.session);

    if (!user) {
      this.logger.warn("Dashboard access without authentication");
      res.status(403).redirect("/login");
      return;
    }

    const result = await this.service.getDashboard(user.userId, user.role);

    if(result.ok === false && result.value.name === "UnexpectedDependencyError" && result.value.message === "Staff members cannot access the dashboard.") {
      res.status(403).redirect("/staff/events");
      return;
    }

    if (result.ok === false) {
      this.logger.error(`Dashboard fetch failed for user=${user.userId}: ${result.value.message}`);
      res.status(500).location("/?error=dashboard_unavailable").end();
      return;
    }

    this.logger.info(`Dashboard loaded for user=${user.userId}`);
    // Pass the view model to your template engine of choice.
    // ;
    if(req.headers["hx-request"] === "true") {
      res.status(200).render("partials/dashboard-sections", { dashboard: result.value, session: req.session, layout: false });
      return;
    }
    res.status(200).render("dashboard", { dashboard: result.value, session: req.session });
  }
}

export function CreateDashboardController(
  service: IDashboardService,
  logger: ILoggingService,
): IDashboardController {
  return new DashboardController(service, logger);
}