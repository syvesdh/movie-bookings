# Cinéma — Editorial Cinema Booking

A cinema booking platform with a **real Postgres database**, a **mock payment flow**, and a **luxury/editorial UI**. Its defining guarantee: **no two patrons can ever book the same seat**, enforced with a real `SELECT … FOR UPDATE` pessimistic-locking transaction and a 10-minute hold TTL.

Built with **Next.js 16 (App Router)** + **Supabase (Postgres)** + **Tailwind CSS v4** + **TanStack Query**, designed to deploy to **Vercel** from a single repo.

> Architecture reference: [`system-design.md`](system-design.md). Visual language: [`design-style.md`](design-style.md).

---

## Features

- **Browse** a curated programme of films → showtimes → live seat map.
- **Reserve** seats with a true atomic lock (concurrent double-booking returns `409`).
- **10-minute hold** with a live countdown; expired holds auto-release (lazy TTL).
- **Mock payment** gateway (no real charge; client-side tokenisation pattern, with a simulated decline path).
- **Confirmation ticket** with a booking reference.
- **Anonymous sessions** today (httpOnly cookie); designed so real auth slots in later by changing one function.

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Server Components + Route Handlers) |
| Database | Supabase / PostgreSQL |
| Concurrency | `lock_seats()` Postgres function — `SELECT … FOR UPDATE` |
| Styling | Tailwind CSS v4 (`@theme` tokens), Playfair Display + Inter |
| Data fetching | TanStack Query (live seat-map polling) |
| Deploy | Vercel |

---

## Getting started

### 1. Create a Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. In the **SQL Editor**, run these files in order:
   - [`supabase/migrations/0001_schema.sql`](supabase/migrations/0001_schema.sql)
   - [`supabase/migrations/0002_functions.sql`](supabase/migrations/0002_functions.sql)
   - [`supabase/seed.sql`](supabase/seed.sql)  *(seeds movies, shows, and seat maps)*
3. From **Settings → API**, copy your Project URL, `anon` key, and `service_role` key.

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key      # server-only, never exposed to the client
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Run

```bash
npm install
npm run dev        # http://localhost:3000
```

---

## How seat locking works (the core guarantee)

When a patron clicks **Reserve**, the API calls the `lock_seats()` Postgres function, which in one transaction:

1. Lazily releases any holds whose TTL has expired for that show.
2. `SELECT … FOR UPDATE` on the requested `show_seats` rows (pessimistic lock).
3. Verifies every requested seat is still `AVAILABLE`; if not, raises `SEATS_UNAVAILABLE` → API returns **409**.
4. Flips seats to `LOCKED`, creates a `PENDING_PAYMENT` booking with `expires_at = now() + 10 min`.

Payment then atomically flips `LOCKED → BOOKED` and the booking to `CONFIRMED` via `confirm_booking()`.

**TTL enforcement** is *lazy*: stale holds are released on every seat-map read and every lock attempt — no worker/queue needed for the prototype. For belt-and-braces background cleanup, enable a `pg_cron` job in Supabase:

```sql
-- Supabase Dashboard → Database → Extensions → enable pg_cron, then:
select cron.schedule('release-expired', '* * * * *', $$
  update show_seats ss set status='AVAILABLE'
    from bookings b join booking_items bi on bi.booking_id=b.id
   where bi.show_seat_id=ss.id and b.status='PENDING_PAYMENT'
     and b.expires_at < now() and ss.status='LOCKED';
  update bookings set status='EXPIRED'
   where status='PENDING_PAYMENT' and expires_at < now();
$$);
```

## Mock payment

The form derives a fake token client-side (mirroring how Stripe tokenises a card and hands the backend only a token). Any card **succeeds**; a number starting `4000 0000` simulates a **decline** (`402`) so the failure branch is demoable.

---

## API

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/v1/movies?name=&genre=` | List films |
| `GET` | `/api/v1/movies/{id}` | Film details + showtimes |
| `GET` | `/api/v1/shows/{id}/seats` | Live seat map (auto-expires stale holds) |
| `POST` | `/api/v1/bookings/lock` | Lock seats → `{ booking_id, expires_at }` or `409` |
| `POST` | `/api/v1/bookings/{id}/payment` | Mock pay → `CONFIRMED` |

---

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import it at [vercel.com/new](https://vercel.com/new).
3. Add the four environment variables from `.env.local` in the Vercel project settings.
4. Deploy. (The same Supabase project backs local and production, or create a separate one for prod.)

---

## Project structure

```
src/
  app/                     # pages + /api/v1 route handlers
  components/              # UI primitives (ui/), layout/, seat map, booking flow
  lib/
    supabase/admin.ts      # service-role client (server only)
    data.ts                # server-side queries (Server Components + routes)
    session.ts             # getOrCreateUserId() — swap here for real auth
    api.ts · types.ts · format.ts
supabase/
  migrations/*.sql · seed.sql
```

## Roadmap

- Real auth (Supabase Auth) — replace `getOrCreateUserId()`.
- Real Stripe test-mode payments replacing the mock gateway.
- Redis caching for browse endpoints; read replicas (per `system-design.md` §4–5).
