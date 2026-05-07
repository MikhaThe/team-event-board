import { PrismaClient } from "@prisma/client";
import type { IComment } from "./Comment";
import type { ICommentRepository, CommentError } from "./CommentRepository";
import { Ok, Err } from "../lib/result";
import type { Result } from "../lib/result";

class PrismaCommentRepository implements ICommentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByEvent(eventId: string): Promise<Result<IComment[], CommentError>> {
    try {
      const rows = await this.prisma.eventComment.findMany({
        where: { eventId },
        orderBy: { createdAt: "asc" },
      });
      return Ok(rows.map(this.toComment));
    } catch {
      return Err({ name: "CommentNotFound" as const, message: "Failed to load comments." });
    }
  }

  async create(input: {
    eventId: string;
    userId: string;
    userName: string;
    body: string;
    isOrganizer: boolean;
  }): Promise<Result<IComment, CommentError>> {
    try {
      const row = await this.prisma.eventComment.create({
        data: {
          id: crypto.randomUUID(),
          eventId: input.eventId,
          userId: input.userId,
          userName: input.userName,
          body: input.body,
          isOrganizer: input.isOrganizer,
          createdAt: new Date(),
        },
      });
      return Ok(this.toComment(row));
    } catch {
      return Err({ name: "InvalidComment" as const, message: "Failed to save comment." });
    }
  }

  private toComment(raw: any): IComment {
    return {
      id: raw.id,
      eventId: raw.eventId,
      userId: raw.userId,
      userName: raw.userName,
      body: raw.body,
      isOrganizer: raw.isOrganizer,
      createdAt: raw.createdAt as Date,
    };
  }
}

export function CreatePrismaCommentRepository(prisma: PrismaClient): ICommentRepository {
  return new PrismaCommentRepository(prisma);
}
