export type EventDetailError =
  | { name: "EventNotFound"; message: string }
  | { name: "Forbidden"; message: string }
  | { name: "InvalidTransition"; message: string }

export const EventNotFound = (message: string): EventDetailError => ({
  name: "EventNotFound",
  message,
})

export const Forbidden = (message: string): EventDetailError => ({
  name: "Forbidden",
  message,
})

export const InvalidTransition = (message: string): EventDetailError => ({
  name: "InvalidTransition",
  message,
})

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