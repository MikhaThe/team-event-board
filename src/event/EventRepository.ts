type Event = {
  id: string
  title: string
  description: string
  location: string
  category: string
  status: "draft" | "published" | "cancelled" | "past"
  organizerId: string
  startDatetime: string
  endDatetime: string
}

// simple in-memory store
const events = new Map<string, Event>()

export function findById(id: string): Event | null {
  return events.get(id) ?? null
}