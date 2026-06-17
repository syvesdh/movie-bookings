# Getting Started

Local setup and deployment for the Cinéma booking platform. See the [README](README.md) for an overview.

## 1. Create a Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. In the **SQL Editor**, run these files in order:
   - [`supabase/migrations/0001_schema.sql`](supabase/migrations/0001_schema.sql)
   - [`supabase/migrations/0002_functions.sql`](supabase/migrations/0002_functions.sql)
   - [`supabase/seed.sql`](supabase/seed.sql) — seeds movies, shows, and seat maps
3. From **Settings → API**, copy your Project URL, `anon` key, and `service_role` key.

## 2. Configure environment

```bash
cp .env.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key      # server-only, never exposed to the client
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 3. Run

```bash
npm install
npm run dev        # http://localhost:3000
```

---

## Background TTL cleanup (optional)

Expired holds are released lazily on every seat-map read and lock attempt, so no
worker is required. For belt-and-braces background cleanup, enable `pg_cron` in
Supabase (Database → Extensions) and schedule:

```sql
select cron.schedule('release-expired', '* * * * *', $$
  update show_seats ss set status='AVAILABLE'
    from bookings b join booking_items bi on bi.booking_id=b.id
   where bi.show_seat_id=ss.id and b.status='PENDING_PAYMENT'
     and b.expires_at < now() and ss.status='LOCKED';
  update bookings set status='EXPIRED'
   where status='PENDING_PAYMENT' and expires_at < now();
$$);
```

---

## Deploy to Vercel

1. Push the repo to GitHub.
2. Import it at [vercel.com/new](https://vercel.com/new).
3. Add the four environment variables from `.env.local` in the Vercel project settings.
4. Deploy. Use the same Supabase project for both local and production, or create a separate one for prod.
