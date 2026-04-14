import { Request, Response } from "express"
import { EventService } from "./EventService"
import { getAuthenticatedUser } from "../session/AppSession"

const eventService = new EventService()

export async function showEvent(req: Request, res: Response) {
  const eventId = req.params.id as string
  const user = getAuthenticatedUser(req.session)

  const result = eventService.getEventDetail(
    eventId,
    user?.userId,
    user?.role,
  )

  if (!result.ok) {
    if (result.value.name === "EventNotFound") {
      return res.status(404).send(result.value.message)
    }
    if (result.value.name === "Forbidden") {
      return res.status(403).send(result.value.message)
    }
  }

  return res.render("eventDetail", {
    event: result.value,
  })
}