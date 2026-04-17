export type EventError =
  | { name: "EventNotFound"; message: string }
  | { name: "Unauthorized"; message: string }
  | { name: "InvalidTransition"; message: string }
  | { name: "ValidationError"; message: string }
  | { name: "UnexpectedError"; message: string };

export const EventNotFound = (message: string): EventError => ({
  name: "EventNotFound",
  message,
});

export const Unauthorized = (message: string): EventError => ({
  name: "Unauthorized",
  message,
});

export const InvalidTransition = (message: string): EventError => ({
  name: "InvalidTransition",
  message,
});

export const EventValidationError = (message: string): EventError => ({
  name: "ValidationError",
  message,
});

export const UnexpectedError = (message: string): EventError => ({
  name: "UnexpectedError",
  message,
});
