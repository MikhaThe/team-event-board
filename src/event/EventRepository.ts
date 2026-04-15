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

events.set("2", {
  id: "2",
  title: "Music Night",
  description: "Live music event on campus.",
  location: "Campus Center",
  category: "Music",
  status: "published",
  organizerId: "user2",
  organizerName: "Sam Staff",
  startDatetime: "2026-04-22T18:00:00",
  endDatetime: "2026-04-22T20:00:00",
  attendeeCount: 30,
  capacity: 50,
})

events.set("3", {
  id: "3",
  title: "Private Draft Event",
  description: "This is a draft event.",
  location: "Hidden Room",
  category: "School",
  status: "draft",
  organizerId: "user1",
  organizerName: "Una User",
  startDatetime: "2026-04-25T09:00:00",
  endDatetime: "2026-04-25T10:00:00",
  attendeeCount: 0,
  capacity: 10,
})

export function findById(id: string): Event | null {
  return events.get(id) ?? null
}

// Feature 6
export function findAll(): Event[] {
  return Array.from(events.values())
}