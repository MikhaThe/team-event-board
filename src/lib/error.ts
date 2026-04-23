export type EventDetailError =
  | { name: "EventNotFound"; message: string }
  | { name: "Forbidden"; message: string }
  | { name: "InvalidTransition"; message: string }
  | { name: "InvalidInput"; message: string }

export type FilterError =
  | { name: "InvalidCategory"; message: string }
  | { name: "InvalidDate"; message: string }

export type RSVPError =
  | { name: "RSVP Not Found"; message: string }
  | { name: "Invalid RSVP"; message: string }
  | { name: "Unexpected RSVP Error"; message: string }

export const RSVPNotFound = (message: string): RSVPError => ({
  name: "RSVP Not Found",
  message,
})

export const InvalidRSVP = (message: string): RSVPError => ({
  name: "Invalid RSVP",
  message,
})

export const UnexpectedRSVPError = (message: string): RSVPError => ({
  name: "Unexpected RSVP Error",
  message,
})

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

export const InvalidInput = (message: string): EventDetailError => ({
  name: "InvalidInput",
  message,
})

export const InvalidCategory = (message: string): FilterError => ({
  name: "InvalidCategory",
  message,
})

export const InvalidDate = (message: string): FilterError => ({
  name: "InvalidDate",
  message,
})
