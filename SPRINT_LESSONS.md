# Sprint Process Lessons

Lessons learned from Sprint 1, 2, & 3 to avoid repeating in future sprints.

---

## Git & Branching

- **Always target `dev`, never `main`** — PRs go to `dev`. Teammates merge `dev` → `main` at release.
- **Work on a feature branch** — never commit directly to `dev` or `main`.
- **Verify you are on the right branch before doing anything** — run `git branch` first.
- **After a teammate merge or rebase, run `npx tsc --noEmit` and `npm test` immediately** — teammates' conflict resolutions can silently break your code (e.g. routes get commented out, wrong property names).
- **After `git pull --rebase`, check for new TypeScript errors** — teammates' code may introduce bugs that weren't there before.
- **Check that your routes aren't commented out after any merge** — this happened in Sprint 2 and caused all HTTP tests to return 404.

---

## Pull Request Size

- **Break each feature into 4 small PRs, one per layer:**
  1. Repository layer (interfaces + methods)
  2. Service layer (business logic)
  3. Controller, routes, and views
  4. Tests
- **Stack the PRs** — each PR targets the previous layer's branch, not `dev` directly. When PR 1 merges into `dev`, PR 2's base automatically updates.
- **One big PR = hard to review** — teammates can't give useful feedback on 700-line diffs.

---

## Repositories & Code Organization

- **Do not create separate repositories for a new feature** — add methods to the existing shared repositories in `src/event/EventRepository.ts` and `src/rsvp/RSVPRepository.ts`.
- **Keep feature logic in its own folder** — e.g. `src/organizerdashboard/` for the organizer dashboard, not inside `src/event/`.
- **Do not duplicate existing infrastructure** — check what already exists before writing new files.

---

## Seed Data & Test Users

- **Use the real test user IDs in seed data** — `user-staff` and `user-admin`, not placeholder names like `user1` or `user2`. Tests log in as `staff@app.test` and `admin@app.test` which map to these IDs — mismatched IDs cause tests to silently pass with wrong data.

---

## Wiring (composition.ts + app.ts)

- **Every new controller must be passed through the full chain:** created in `composition.ts` → passed to `CreateApp()` → added to `ExpressApp` constructor → routes registered in `registerRoutes()`.
- **If a controller is created but not passed to `CreateApp`, its routes will 404** — always verify the wiring end-to-end.
- **Add `organizerController` (or any new controller) to the `CreateApp` function signature and the `ExpressApp` constructor** — forgetting either step breaks the routes silently.

---

## HTMX

- **Do not mix Alpine.js `@submit.prevent` with `hx-confirm`** — use one or the other. `hx-confirm` is the correct approach for HTMX confirmation dialogs.
- **HTMX partial responses need `layout: false`** — when returning a partial for HTMX, pass `layout: false` to the EJS render call so the full page layout is not included.

---

## Testing

- **Write HTTP integration tests alongside service unit tests** — service tests alone don't catch wiring bugs (missing routes, wrong status codes).
- **Run `npm test` before pushing** — don't assume tests pass just because the TypeScript compiles.
- **For unauthenticated POST requests, expect 401 not 302** — the app only redirects GET requests to `/login`; POST requests get a 401 response.

---

## Sprint 3 — Prisma Integration

- **Only the Repository layer changes when swapping to a real database** — if your Service and Controller layers had to change, the layers were not properly separated.
- **Use `NODE_ENV === 'test'` to keep in-memory repos for the test suite** — integration tests rely on fresh, seeded state per `makeApp()` call; Prisma shares a file-based DB across calls, which breaks test isolation.
- **Run `npx prisma migrate dev` not just `prisma generate`** — `migrate dev` both applies the migration AND regenerates the client. Running only `generate` without a migration leaves the database out of sync.
- **The `better-sqlite3` driver adapter does not read `DATABASE_URL` from the schema** — you must parse the env var yourself and pass the resolved path to `new PrismaBetterSQLite(path)`.
- **Prisma model names map to camelCase client properties** — a model named `RSVP` becomes `db.rSVP`, not `db.RSVP`. Name models in PascalCase (`Rsvp`) if you want `db.rsvp`.
