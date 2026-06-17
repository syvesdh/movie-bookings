# Cinéma — Editorial Cinema Booking

> An interview exercise: a cinema booking platform built from a written system design.

A full-stack prototype with a **real Postgres database**, a **mock payment flow**, and a **luxury/editorial UI**. Its defining guarantee: **no two patrons can ever book the same seat**, enforced with a real `SELECT … FOR UPDATE` pessimistic-locking transaction and a 10-minute hold.

**[→ Getting Started](GETTING_STARTED.md)** · Architecture: [`system-design.md`](system-design.md) · Visual language: [`design-style.md`](design-style.md)

## Features

- **Browse** a curated programme of films → showtimes → live seat map.
- **Reserve** seats with a true atomic lock — concurrent double-booking returns `409`.
- **10-minute hold** with a live countdown; expired holds auto-release.
- **Mock payment** gateway (no real charge, with a simulated decline path) and a confirmation ticket.
- **Anonymous sessions** today; structured so real auth slots in by changing one function.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router — Server Components + Route Handlers) |
| Database | Supabase / PostgreSQL |
| Concurrency | `lock_seats()` Postgres function — `SELECT … FOR UPDATE` |
| Styling | Tailwind CSS v4, Playfair Display + Inter |
| Data fetching | TanStack Query (live seat-map polling) |
| Deploy | Vercel |

## Seat locking — the core guarantee

On **Reserve**, one transaction in `lock_seats()`:

1. Releases any holds past their TTL for the show.
2. `SELECT … FOR UPDATE` locks the requested `show_seats` rows.
3. If any seat isn't `AVAILABLE`, raises `SEATS_UNAVAILABLE` → API returns **409**.
4. Sets seats `LOCKED` and creates a `PENDING_PAYMENT` booking expiring in 10 minutes.

Payment then atomically flips `LOCKED → BOOKED` and the booking to `CONFIRMED`.

## API

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/v1/movies?name=&genre=` | List films |
| `GET` | `/api/v1/movies/{id}` | Film details + showtimes |
| `GET` | `/api/v1/shows/{id}/seats` | Live seat map (auto-expires stale holds) |
| `POST` | `/api/v1/bookings/lock` | Lock seats → `{ booking_id, expires_at }` or `409` |
| `POST` | `/api/v1/bookings/{id}/payment` | Mock pay → `CONFIRMED` |

## Project structure

```
src/
  app/            # pages + /api/v1 route handlers
  components/     # ui/ primitives, layout/, seat map, booking flow
  lib/            # supabase client, server queries, session, types
supabase/
  migrations/*.sql · seed.sql
```

## Roadmap

- Real auth (Supabase Auth) — replace `getOrCreateUserId()`.
- Real Stripe test-mode payments replacing the mock gateway.
- Redis caching for browse endpoints; read replicas (per `system-design.md` §4–5).
