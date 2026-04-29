Sprint 1: Can I Build a Working Feature?
Overview
Theme: "Can I build a working feature?"

Dates: Apr 9 – Apr 16
Kickoff: Thu, Apr 9 (in-class lecture)
Workday: Tue, Apr 14 (unstructured development time)
Due: Wed, Apr 16 before class
Lab: Fri, Apr 10 (practice presentations — ungraded)

Sprint 1 is about getting your application skeleton in place and proving that you can build a complete, working feature from HTTP request to in-memory data and back. No database yet, no dynamic UI — just a clean, layered architecture that will support everything you add over the next three sprints.

By the end of this sprint, both of your features must be working in the browser with real HTML pages, backed by in-memory data, using the Result pattern throughout.

What You Are Building
Every HTTP request in your application must flow through exactly four layers in order:

Route  →  Controller  →  Service  →  Repository
Layer	Responsibility
Route	Maps a URL + HTTP method to a controller function. Nothing else.
Controller	Parses the request (body, params, session). Calls the service. Maps the Result to an HTTP response.
Service	Contains all business logic. Has no knowledge of HTTP. Returns Result<T, E>. Never reads from the session directly — receives user identity as parameters.
Repository	Handles data access. In Sprint 1, this means arrays or Maps stored in memory.
This separation is not optional. It is the foundation that makes Sprint 3's database migration and Sprint 2's testing possible without rewriting your business logic.

The Result Pattern
All service methods must return a Result<T, E> — starting now, in Sprint 1. Do not throw exceptions for expected business-logic failures. Return a typed result instead.

// In your service
return { ok: true, value: createdEvent }
// or
return { ok: false, error: new InvalidInputError("End time must be after start time") }

// In your controller
const result = await EventService.createEvent(data)

if (result.ok === false) {
  return res.status(400).send(result.error.message)
}

return res.status(201).send(renderEvent(result.value))
The Result pattern makes your error paths explicit, prevents accidental exception leakage, and allows your Sprint 2 tests to assert on specific failure types. Build it right from the start — retrofitting it later is painful.

Before You Write Any Code
Complete the following as a team before Sprint 1 development begins on April 9.

1. Repository Setup
One team member forks the starter repo; all others are added as collaborators with push access.

# Everyone clones and verifies the app runs locally before writing code
git clone https://github.com/<your-username>/<your-repo-name>.git
cd <your-repo-name>
# follow README.md to install dependencies and start the server
See git-workflow for the full step-by-step setup procedure.

No one writes feature code until every teammate can run the application locally.

2. Create the dev Branch
Your main branch is reserved for stable, sprint-end snapshots. All development happens on dev and task branches.

git checkout -b dev
git push origin dev
3. Confirm Feature Assignments
Each team member owns exactly two features from features. No two team members may claim the same feature. Confirm assignments with your instructor at the April 9 kickoff.

4. Write CONTRACTS.md
Before any feature code is written, your team must agree on the interface contracts for every service method that two or more features share or depend on.

Document these in a CONTRACTS.md file at the root of your repository. Each contract should specify:

The method signature (name, parameters, return type)
What a successful result looks like
What named errors it can return
Why this matters: If you change a service method's return shape after a teammate has already built against it, that is an Integration Compromise — a −10 point penalty on your individual sprint score. CONTRACTS.md is your protection. See grading for details.

What Needs to Be Done
For Each Feature You Own
Break each feature into layer-based task branches. Do not implement an entire feature in a single branch — one branch per layer, one PR per branch.

Recommended task breakdown (per feature):

Task Branch	What It Contains
task/<feature>-repo	In-memory repository: data structure + CRUD operations
task/<feature>-service	Service logic: validation, business rules, Result returns
task/<feature>-route-controller	Express route registration + controller (parse request, call service, respond)
task/<feature>-template	Nunjucks/HTML template(s) for the feature's pages
Each task branch is created from dev, opened as a Pull Request targeting dev, reviewed by a teammate, and merged. Only stable, reviewed code reaches dev.

Feature-Specific Sprint 1 Requirements
The following is a summary of what Sprint 1 requires for each available feature. Locate your assigned features in features for the authoritative description.

Feature	Sprint 1 Focus
1 — Event Creation	Form page + submission handling. Service validates input and creates the event. In-memory repo. Organizer identity comes from session only.
2 — Event Detail Page	Route + service to look up an event by ID. Render full details. Draft events hidden from unauthorized users.
3 — Event Editing	Edit form + submission flow. Service verifies ownership and valid event state. Reuse creation validation rules.
4 — RSVP Toggle	Toggle route + service handling three states: new (going/waitlisted), active→cancelled, cancelled→reactivated.
5 — Event Publishing & Cancellation	Routes for draft→published and published→cancelled transitions. Service enforces ownership and valid state.
6 — Category and Date Filter	Service-layer filter logic wired to event list route via query parameters. Only published events appear.
7 — My RSVPs Dashboard	Dashboard route + service to retrieve a user's RSVPs joined with event details. Correct sort order per section.
8 — Organizer Event Dashboard	Dashboard route + service retrieving events for the acting user grouped by status, with attendee counts.
9 — Waitlist Promotion	Extend RSVP cancellation: promote the next waitlisted member atomically. Calculate and display queue position.
10 — Event Search	Search route + service matching against multiple fields. Empty query returns all published upcoming events.
11 — Past Event Archiving	Archive page route + transition logic for expired events. Archive query in reverse chronological order.
12 — Attendee List (Organizer)	Route + service to retrieve RSVPs for an event joined with display names. Enforce organizer/admin access only.
13 — Event Comments	Data model, post and delete routes, service logic enforcing deletion permissions. In-memory store.
14 — Save for Later	Toggle route + service (save/unsave idempotent). Saved list page. In-memory store.
In-Memory Repository Design
Sprints 1 and 2 use in-memory data. Design your repositories to match the shape described in project-overview so that switching to Prisma in Sprint 3 only requires changes in the repository layer — not the service or controller.

Core shapes to store:

Event

id, title, description, location, category
status: draft | published | cancelled | past
capacity (optional — no limit if absent)
startDatetime, endDatetime
organizerId (user ID from session)
createdAt, updatedAt
RSVP

id, eventId, userId
status: going | waitlisted | cancelled
createdAt (determines waitlist order)
Store these in module-level Map or array structures. Export functions that operate on them — do not let the service layer touch the data structure directly.

Git & Collaboration Requirements
Every point in the following list is graded under Team Architecture & Git Hygiene (20%).

No direct pushes to main or dev. All code flows through task branches and Pull Requests.
Branch naming: task/<short-description> (e.g., task/event-creation-service). Vague names like task/my-stuff lose points.
Commit message format: prefix: short description — under 72 characters, present tense.
feat: new functionality · fix: bug fix · refactor: restructuring · docs: documentation · chore: config/tooling
PR requirements: Every PR must have a descriptive title, a brief summary of what it does, and at least one reviewer. Do not merge your own PR.
Commit frequency: At minimum 3–5 commits per task branch. At least 1 commit per class session. No "added everything" mega-commits.
Clean codebase: No commented-out code, no leftover console.log statements, no unused imports or dead functions.
Sprint-end merge: Before the due date, open a PR from dev to main titled "Sprint 1: Architecture Foundations". Have a teammate review and approve it. Merge it.
Deliverables
The following must be complete and merged into main before class on April 16.

#	Deliverable	Details
1	Starter repo forked	Team repository exists. All teammates are added as collaborators and can run the app locally.
2	dev branch created	All sprint work branches off dev. main is reserved for the sprint-end merge.
3	CONTRACTS.md written	Interface contracts documented for every shared or dependent service method.
4	Both features working end-to-end	Each feature works in the browser: form/page renders, user action flows through all four layers, result is displayed.
5	In-memory data persistence	Data survives within a server session (no database required yet). Repository layer is isolated.
6	Result pattern in use	All service methods return Result<T, E>. Controllers map results to HTTP responses.
7	4-layer architecture enforced	No HTTP logic in services. No business logic in controllers. No data access outside repositories.
8	Task branches & PRs	All feature code landed via reviewed Pull Requests targeting dev.
9	Sprint-end PR merged	dev merged into main via a reviewed PR titled "Sprint 1: Architecture Foundations".
Grading Breakdown (100 points)
Pillar	Weight	What Is Evaluated
Feature Progress & Code Quality	60%	Both features working in the browser, correct 4-layer separation, Result pattern used throughout, validated business logic, clean code.
Team Architecture & Git Hygiene	20%	Task branch naming, no direct pushes to main/dev, semantic commit messages, no dead code or debug artifacts, sprint-end PR.
Presenter & Audience Task	20%	Practice lab on Apr 10 is ungraded — use it to rehearse. The graded presentation is Apr 17 (Sprint 1 presentations).
Integration Compromise Penalty: −10 points if you change a service interface documented in CONTRACTS.md without coordination and force a teammate to rewrite working code. Avoid this by communicating changes before you make them.

See grading for additional details.

Checklist
Use this to track your personal progress before the due date.

Setup

 Repo forked and teammates added as collaborators
 App runs locally on my machine
 Feature assignments confirmed with instructor
 CONTRACTS.md written and committed to dev
 dev branch created and pushed
Feature 1 (your first feature)

 Repository layer implemented (in-memory data structure + operations)
 Service layer implemented (business logic, validation, Result returns)
 Route + Controller implemented (parses request, calls service, maps response)
 Template/HTML renders the feature correctly in the browser
 End-to-end flow tested manually in the browser
 All task branches merged into dev via reviewed PRs
Feature 2 (your second feature)

 Repository layer implemented
 Service layer implemented
 Route + Controller implemented
 Template/HTML renders the feature correctly in the browser
 End-to-end flow tested manually in the browser
 All task branches merged into dev via reviewed PRs
Sprint Close

 dev is stable — all features work together
 Codebase is clean (no dead code, no console.log, no unused imports)
 PR from dev to main opened, reviewed, and merged
 Practice presentation prepared for Fri, Apr 10 lab
Common Mistakes to Avoid
Putting business logic in the controller. Validation, capacity checks, and state enforcement belong in the service. The controller only parses and delegates.
Reading req.session in the service. The controller extracts userId and role from the session and passes them as parameters. The service never sees req.
Throwing exceptions for expected failures. An event not found is not an exceptional case — it is an expected outcome. Return { ok: false, error: ... } instead of throwing.
One giant branch per feature. Break each feature into layer-by-layer task branches. A PR that touches every layer at once is too big to review and loses Git Hygiene points.
Designing in-memory structures that don't match the domain model. You will migrate this to Prisma in Sprint 3. If your in-memory shape is radically different from what Prisma will need, the migration will be painful. Match the field names and relationships described in project-overview now.
Not pulling before branching. Always git pull origin dev before creating a new task branch. Stale branches cause avoidable merge conflicts.