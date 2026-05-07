import type { IComment } from "./Comment";
import type { Result } from "../lib/result";
import { Ok } from "../lib/result";

export type CommentError =
  | { name: "CommentNotFound"; message: string }
  | { name: "InvalidComment"; message: string };

export interface ICommentRepository {
  findByEvent(eventId: string): Promise<Result<IComment[], CommentError>>;
  create(input: {
    eventId: string;
    userId: string;
    userName: string;
    body: string;
    isOrganizer: boolean;
  }): Promise<Result<IComment, CommentError>>;
}

class InMemoryCommentRepository implements ICommentRepository {
  private store: IComment[] = [];

  async findByEvent(eventId: string): Promise<Result<IComment[], CommentError>> {
    return Ok(this.store.filter((c) => c.eventId === eventId));
  }

  async create(input: {
    eventId: string;
    userId: string;
    userName: string;
    body: string;
    isOrganizer: boolean;
  }): Promise<Result<IComment, CommentError>> {
    const comment: IComment = {
      id: crypto.randomUUID(),
      createdAt: new Date(),
      ...input,
    };
    this.store.push(comment);
    return Ok(comment);
  }
}

export function CreateCommentRepository(): ICommentRepository {
  return new InMemoryCommentRepository();
}
