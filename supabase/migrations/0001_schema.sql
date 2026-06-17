-- Cinema Booking Platform — schema
-- Mirrors system-design.md §1. Run this in the Supabase SQL editor first.

create extension if not exists "pgcrypto";

-- Movies catalog
create table if not exists movies (
  id           uuid primary key default gen_random_uuid(),
  title        varchar(255) not null,
  description  text,
  trailer_url  varchar(512),
  genre        varchar(100),
  release_date date,
  duration     int,                 -- minutes
  poster_url   varchar(512),        -- added for the UI
  created_at   timestamptz not null default now()
);

-- A movie at a specific time on a specific screen
create table if not exists shows (
  id          uuid primary key default gen_random_uuid(),
  movie_id    uuid not null references movies(id) on delete cascade,
  screen_name varchar(50) not null,
  start_time  timestamptz not null,
  end_time    timestamptz not null,
  price       decimal(10,2) not null default 12.00  -- per-seat price
);

-- Physical seat layout of a screen
create table if not exists seats (
  id          uuid primary key default gen_random_uuid(),
  screen_name varchar(50) not null,
  row_num     varchar(5) not null,
  col_num     int not null
);

-- Dynamic state of a physical seat for a given show (concurrency control)
create table if not exists show_seats (
  id      uuid primary key default gen_random_uuid(),
  show_id uuid not null references shows(id) on delete cascade,
  seat_id uuid not null references seats(id) on delete cascade,
  status  varchar(20) not null default 'AVAILABLE',  -- AVAILABLE | LOCKED | BOOKED
  version int not null default 0,
  unique (show_id, seat_id)
);

-- Bookings (pending / confirmed / expired)
create table if not exists bookings (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null,
  show_id     uuid not null references shows(id) on delete cascade,
  total_price decimal(10,2) not null default 0,
  status      varchar(20) not null default 'PENDING_PAYMENT', -- PENDING_PAYMENT | CONFIRMED | EXPIRED
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null
);

-- Seats belonging to a booking
create table if not exists booking_items (
  id           uuid primary key default gen_random_uuid(),
  booking_id   uuid not null references bookings(id) on delete cascade,
  show_seat_id uuid not null references show_seats(id) on delete cascade
);

create index if not exists idx_show_seats_show_status on show_seats(show_id, status);
create index if not exists idx_show_seats_seat on show_seats(seat_id);
create index if not exists idx_bookings_status_expires on bookings(status, expires_at);
create index if not exists idx_shows_movie on shows(movie_id);
