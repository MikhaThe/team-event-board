# Interface Contracts

All service methods follow the Result<T, E> pattern from `src/lib/result.ts`.
Changes to any contract below require team discussion before implementation.
Undiscussed changes that force a teammate to rewrite working code = Integration Compromise (-10 pts).

---

## EventService.createEvent(data)

**Owner:** Taha Kiani (Feature 1)

**Parameters:**
```ts
{
  title: string;
  description: string;
  location: string;
  category: string;
  capacity?: number | null;
  startDatetime: Date;
  endDatetime: Date;
  organizerId: string;
}
```

**Success:**
```ts
Ok({
  id: string;
  title: string;
  description: string;
  location: string;
  category: string;
  status: 'draft';           
  capacity: number | null;
  startDatetime: Date;
  endDatetime: Date;
  organizerId: string;
  createdAt: Date;
  updatedAt: Date;
})
```

**Errors:**
- `InvalidInputError` — missing required fields, end time not after start time, capacity < 1

---

## EventRepository.findEventById(id)

**Owner:** Taha Kiani (Feature 1)

**Parameters:** `id: string`

**Returns:** The event object (same shape as above) or `null` if not found.

---

## EventRepository.getAllEvents()

**Owner:** Taha Kiani (Feature 1)

**Returns:** `Event[]` — all events in memory.

---

## AttendeeService.getAttendeeList(eventId, requestingUserId, requestingUserRole)

**Owner:** Taha Kiani (Feature 12)

**Parameters:**
```ts
eventId: string
requestingUserId: string
requestingUserRole: 'admin' | 'staff' | 'user'
```

**Success:**
```ts
Ok({
  event: Event;
  going: EnrichedRsvp[];
  waitlisted: EnrichedRsvp[];
  cancelled: EnrichedRsvp[];
})
```
where `EnrichedRsvp = Rsvp & { displayName: string }`

**Errors:**
- `NotFoundError` — event does not exist
- `ForbiddenError` — requesting user is not the organizer and not an admin

---

## RsvpRepository.findRsvpsByEventId(eventId)

**Owner:** Derek Salguero (Feature 4)
**Needed by:** Feature 12

**Parameters:** `eventId: string`

**Returns:**
```ts
Array<{
  id: string;
  eventId: string;
  userId: string;
  status: 'going' | 'waitlisted' | 'cancelled';
  createdAt: Date;
}>
```