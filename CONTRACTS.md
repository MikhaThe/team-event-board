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

**Returns:** `Promise<Result<Event | null, EventDetailError>>`
— the event object or null if not found.

---

## EventRepository.findAll()

**Owner:** Taha Kiani (Feature 1)

**Returns:** `Promise<Result<Event[], EventDetailError>>`
— all events currently in memory.

---

## AttendeeService.getAttendeeList(...)

**Owner:** Taha Kiani (Feature 12)

**Parameters:**
```ts
eventId: string,
requestingUserId: string,
requestingUserRole: string,
getUserDisplayName: (userId: string) => Promise<string>
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

---

## Sprint 3 Changes

### What changed in Sprint 3

**EventRepository (Feature 1)**
- Production now uses `PrismaEventRepository` (SQLite via Prisma)
- Tests use `CreateInMemoryEventRepository()` (renamed from 
  `InMemoryEventRepository`)
- Interface error type changed from `string` to `EventDetailError`
  across all 8 methods

**AttendeeService.getAttendeeList (Feature 12)**
- `getUserDisplayName` parameter type changed from:
    `(userId: string) => string`
  to:
    `(userId: string) => Promise<string>`
- Controller now resolves display names via 
  `IUserRepository.findById(userId)` instead of session-only lookup
- This change is backward compatible — tests pass `authUsers` 
  directly to `CreateAttendeeController` as the 3rd argument

**RSVPRepository (Feature 4)**
- Production uses in-memory `CreateRSVPRepository()` for now
- `PrismaRSVPRepository` was prototyped but removed by team decision
- `findByEvent` is the correct method name (not `findByEventId`)

### createComposedApp signature (shared infrastructure)
The function now requires a mode argument:
  createComposedApp("prisma")  // production
  createComposedApp("memory")  // tests

All test files must pass "memory" as the first argument.