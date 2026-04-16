export type Event = {
  id: string
  title: string
  description: string
  location: string
  category: string
  status: "draft" | "published" | "cancelled" | "past"
  organizerId: string
  organizerName: string
  startDatetime: string
  endDatetime: string
  attendeeCount: number
  capacity?: number
}
