import type { Response } from "express";
import type { IDashboardService } from "./DashboardService";
import type { ILoggingService } from "../service/LoggingService";
import type { IAppBrowserSession } from "../session/AppSession";

export interface IDashboardController {
  getDashboard(
    res: Response,
    session: IAppBrowserSession,
  ): Promise<void>;
}

class DashboardController implements IDashboardController {
  constructor(
    private readonly service: IDashboardService,
    private readonly logger: ILoggingService,
  ) {}

  async getDashboard(res: Response, session: IAppBrowserSession): Promise<void> {
    const user = session.authenticatedUser;
    if (!user) {
      this.logger.warn("Dashboard access without authentication");
      res.status(403).redirect("/login");
      return;
    }

    // Staff members manage events — they don't RSVP to them.
    if (user.role === "staff") {
      this.logger.warn(`Staff member ${user.userId} attempted dashboard access`);
      res.status(403).redirect("/staff/events");
      return;
    }

    const result = await this.service.getDashboard(user.userId);
    if (result.ok === false) {
      this.logger.error(`Dashboard fetch failed for user=${user.userId}: ${result.value.message}`);
      res.status(500).redirect("/?error=dashboard_unavailable");
      return;
    }

    this.logger.info(`Dashboard loaded for user=${user.userId}`);
    // Pass the view model to your template engine of choice.
    res.status(200).render("dashboard", { dashboard: result.value });
  }
}

export function CreateDashboardController(
  service: IDashboardService,
  logger: ILoggingService,
): IDashboardController {
  return new DashboardController(service, logger);
}