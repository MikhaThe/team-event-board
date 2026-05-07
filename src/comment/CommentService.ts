import type { IComment } from "./Comment";
import type { ICommentRepository, CommentError } from "./CommentRepository";
import type { IEventRepository } from "../event/EventRepository";
import type { IRSVPRepository } from "../rsvp/RSVPRepository";
import type { Result } from "../lib/result";
import { Ok, Err } from "../lib/result";

export interface ICommentService {
  getComments(eventId: string): Promise<Result<IComment[], CommentError>>;
  postComment(input: {
    eventId: string;
    userId: string;
    userName: string;
    userRole: string;
    body: string;
  }): Promise<Result<IComment, CommentError>>;
}

class CommentService implements ICommentService {
  constructor(
    private readonly commentRepo: ICommentRepository,
    private readonly eventRepo: IEventRepository,
    private readonly rsvpRepo: IRSVPRepository,
  ) {}

  async getComments(eventId: string): Promise<Result<IComment[], CommentError>> {
    return this.commentRepo.findByEvent(eventId);
  }

  async postComment(input: {
    eventId: string;
    userId: string;
    userName: string;
    userRole: string;
    body: string;
  }): Promise<Result<IComment, CommentError>> {
    const body = input.body.trim();
    if (!body) {
      return Err({ name: "InvalidComment", message: "Comment cannot be empty." });
    }
    if (body.length > 500) {
      return Err({ name: "InvalidComment", message: "Comment must be 500 characters or fewer." });
    }

    const eventResult = await this.eventRepo.findById(input.eventId);
    if (!eventResult.ok || !eventResult.value) {
      return Err({ name: "CommentNotFound", message: "Event not found." });
    }

    const event = eventResult.value;
    const isOrganizer =
      input.userRole === "admin" || event.organizerId === input.userId;

    if (!isOrganizer) {
      // Regular users must have an active "going" RSVP to comment
      const rsvpResult = await this.rsvpRepo.findByUserAndEvent(input.userId, input.eventId);
      if (!rsvpResult.ok || !rsvpResult.value || rsvpResult.value.status !== "going") {
        return Err({
          name: "InvalidComment",
          message: "Only attendees who are going can post comments.",
        });
      }
    }

    return this.commentRepo.create({
      eventId: input.eventId,
      userId: input.userId,
      userName: input.userName,
      body,
      isOrganizer,
    });
  }
}

export function CreateCommentService(
  commentRepo: ICommentRepository,
  eventRepo: IEventRepository,
  rsvpRepo: IRSVPRepository,
): ICommentService {
  return new CommentService(commentRepo, eventRepo, rsvpRepo);
}
