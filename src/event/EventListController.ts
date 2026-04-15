import { Request, Response } from "express"
import { EventService } from "./EventService"

const eventService = new EventService()

export async function listEvents(req: Request, res: Response) {
  const category =
    typeof req.query.category === "string" ? req.query.category : undefined

  const date =
    typeof req.query.date === "string" ? req.query.date : undefined

  const result = await eventService.getFilteredEvents(category, date)

  if (!result.ok) {
    return res.status(500).send(result.value)
  }

  return res.render("eventList", {
    events: result.value,
    selectedCategory: category ?? "",
    selectedDate: date ?? "",
  })
}