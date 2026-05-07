export interface IComment {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  body: string;
  isOrganizer: boolean;
  createdAt: Date;
}
