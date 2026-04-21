export type EventDetailError =
  | { name: "EventNotFound"; message: string }
  | { name: "Forbidden"; message: string }

export type RSVPError =
  | { name: "RSVP Not Found"; message: string }
  | { name: "Invalid RSVP"; message: string }
  | { name: "Unexpected RSVP Error"; message: string};

export const RSVPNotFound = (message: string): RSVPError => ({
  name: "RSVP Not Found",
  message,
});

export const InvalidRSVP = (message: string): RSVPError => ({
  name: "Invalid RSVP",
  message,
});

export const UnexpectedRSVPError = (message: string): RSVPError => ({
  name: "Unexpected RSVP Error",
  message,
})