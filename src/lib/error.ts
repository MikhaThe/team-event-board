export type EventDetailError =
  | { name: "EventNotFound"; message: string }
  | { name: "Forbidden"; message: string }

export type RSVPError =
  | { name: "RSVP Not Found"; message: string }
  | { name: "Invalid RSVP"; message: string };

export const RSVPNotFound = (message: string): RSVPError => ({
  name: "RSVP Not Found",
  message,
});

export const InvalidRSVP = (message: string): RSVPError => ({
  name: "Invalid RSVP",
  message,
});