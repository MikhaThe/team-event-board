# Interface Contracts

All service methods follow the Result<T, E> pattern from `src/lib/result.ts`.
Changes to any contract below require team discussion before implementation.
Undiscussed changes that force a teammate to rewrite working code = 
Integration Compromise (-10 pts).

---

## EventService.createEvent(input)

**Owner:** Taha Kiani (Feature 1)

**Parameters:**
```ts
{
  title: string;
  description: string;
  location: string;
  category: string;
  startDatetime: string;
  endDatetime: string;
  capacity?: number;
  organizerId: string;
  organizerName: string;
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
  status: "draft";
  capacity?: number;
  startDatetime: string;
  endDatetime: string;
  organizerId: string;
  organizerName: string;
  attendeeCount: number;   // always 0 on creation
})
```

**Errors:**
- `{ name: "InvalidInput" }` — missing required fields, end time not 
   after start time, capacity < 1

---

## EventRepository.findById(id)

**Owner:** Taha Kiani (Feature 1)

**Parameters:** `id: string`

**Returns:** `Promise<Result<Event | null, string>>`
— the event object or null if not found.

---

## EventRepository.findAll()

**Owner:** Taha Kiani (Feature 1)

**Returns:** `Promise<Result<Event[], string>>`
— all events currently in memory.

---

## AttendeeService.getAttendeeList(...)

**Owner:** Taha Kiani (Feature 12)

**Parameters:**
```ts
eventId: string,
requestingUserId: string,
requestingUserRole: string,
getUserDisplayName: (userId: string) => string
```

**Success:**
```ts
Ok({
  eventId: string;
  eventTitle: string;
  going: EnrichedRSVP[];
  waitlisted: EnrichedRSVP[];
  cancelled: EnrichedRSVP[];
})
```
where `EnrichedRSVP = IRSVPRecord & { displayName: string }`

**Errors:**
- `{ name: "EventNotFound" }` — event does not exist
- `{ name: "Forbidden" }` — requesting user is not the organizer 
   and not an admin

---

## IRSVPRepository.findByEventId(eventId)

**Owner:** Derek Salguero (Feature 4)
**Needed by:** Feature 12

**Parameters:** `eventId: string`

**Returns:** `Promise<Result<IRSVPRecord[], RSVPError>>`

where `IRSVPRecord` is:
```ts
{
  id: string;
  eventId: string;
  userId: string;
  status: "going" | "waitlisted" | "cancelled";
  createdAt: Date;
}
```

> ⚠️ `id` and `createdAt` are required by Feature 12 for sorting
> and display. Do not remove them without notifying Feature 12 owner.