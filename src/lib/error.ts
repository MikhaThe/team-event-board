export type EventDetailError =
  | { name: "EventNotFound"; message: string }
  | { name: "Forbidden"; message: string }

export type RSVP =
  | { name: "RSVP Not Found"; message: string }
  | { name: "Invalid RSVP"; message: string };