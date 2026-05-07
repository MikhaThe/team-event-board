import type { Request, Response } from "express";
import type { ICommentService } from "./CommentService";
import type { ILoggingService } from "../service/LoggingService";
import { getAuthenticatedUser, touchAppSession, type AppSessionStore } from "../session/AppSession";

export interface ICommentController {
  getComments(req: Request, res: Response): Promise<void>;
  postComment(req: Request, res: Response): Promise<void>;
}

class CommentController implements ICommentController {
  constructor(
    private readonly service: ICommentService,
    private readonly logger: ILoggingService,
  ) {}

  async getComments(req: Request, res: Response): Promise<void> {
    const eventId = req.params.id as string;
    const session = touchAppSession(req.session as AppSessionStore);
    const user = getAuthenticatedUser(req.session);

    const result = await this.service.getComments(eventId);
    if (!result.ok) {
      const err = result.value as { message: string };
      res.status(500).render("partials/error", { message: err.message, layout: false });
      return;
    }

    res.render("partials/comments", {
      comments: result.value,
      eventId,
      session,
      canPost: !!user,
      layout: false,
    });
  }

  async postComment(req: Request, res: Response): Promise<void> {
    const eventId = req.params.id as string;
    const session = touchAppSession(req.session as AppSessionStore);
    const user = getAuthenticatedUser(req.session);

    if (!user) {
      res.status(401).render("partials/error", { message: "Please log in.", layout: false });
      return;
    }

    const body = typeof req.body.body === "string" ? req.body.body : "";

    const result = await this.service.postComment({
      eventId,
      userId: user.userId,
      userName: user.displayName,
      userRole: user.role,
      body,
    });

    if (!result.ok) {
      const err = result.value as { message: string };
      this.logger.warn(`Comment rejected: ${err.message}`);
      const commentsResult = await this.service.getComments(eventId);
      res.status(400).render("partials/comments", {
        comments: commentsResult.ok ? commentsResult.value : [],
        eventId,
        session,
        canPost: true,
        error: err.message,
        layout: false,
      });
      return;
    }

    this.logger.info(`Comment posted: user=${user.userId} event=${eventId}`);

    const commentsResult = await this.service.getComments(eventId);
    res.status(200).render("partials/comments", {
      comments: commentsResult.ok ? commentsResult.value : [],
      eventId,
      session,
      canPost: true,
      error: null,
      layout: false,
    });
  }
}

export function CreateCommentController(
  service: ICommentService,
  logger: ILoggingService,
): ICommentController {
  return new CommentController(service, logger);
}
