import type { Event } from "./Event"

const events = new Map<string, Event>()

events.set("1", {
  id: "1",
  title: "Test Event",
  description: "This is a test event for Feature 2.",
  location: "UMass Amherst",
  category: "School",
  status: "published",
  organizerId: "user1",
  organizerName: "Una User",
  startDatetime: "2026-04-20T10:00:00",
  endDatetime: "2026-04-20T12:00:00",
  attendeeCount: 10,
  capacity: 20,
})

export function findById(id: string): Event | null {
  return events.get(id) ?? null
}