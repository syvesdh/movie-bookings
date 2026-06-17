-- Cinema Booking Platform — seed data
-- Run after 0001_schema.sql and 0002_functions.sql. Safe to re-run (truncates first).

truncate booking_items, bookings, show_seats, shows, seats, movies restart identity cascade;

-- ── Screens & physical seats ──────────────────────────────────────────────
-- Hall A: rows A–H (8) × cols 1–12  = 96 seats
insert into seats(screen_name, row_num, col_num)
select 'Hall A', chr(64 + r), c
from generate_series(1, 8) r, generate_series(1, 12) c;

-- IMAX Screen: rows A–J (10) × cols 1–14 = 140 seats
insert into seats(screen_name, row_num, col_num)
select 'IMAX Screen', chr(64 + r), c
from generate_series(1, 10) r, generate_series(1, 14) c;

-- ── Movies ────────────────────────────────────────────────────────────────
insert into movies(title, description, trailer_url, genre, release_date, duration, poster_url) values
('The Quiet Horizon',
 'A lighthouse keeper on a remote northern coast begins receiving messages that could not possibly exist. A meditative, slow-burning study of solitude and the stories we tell ourselves to survive it.',
 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Drama / Mystery', '2026-05-22', 128,
 'https://picsum.photos/seed/horizon/640/800'),
('Neon Cathedral',
 'In a rain-drenched megacity, an architect discovers the buildings she designs are rewriting the people who live in them. A dazzling neo-noir about memory, power, and the price of beauty.',
 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Sci-Fi / Thriller', '2026-06-05', 142,
 'https://picsum.photos/seed/cathedral/640/800'),
('Last Train to Marseille',
 'Two strangers share a sleeper carriage across a single night, trading the lies that brought them there. A tender, witty chamber piece played out between station stops.',
 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Romance / Drama', '2026-04-18', 109,
 'https://picsum.photos/seed/marseille/640/800'),
('The Cartographer''s Daughter',
 'An adventurer returns to the mountain village she fled as a child to finish the map her father never could. Sweeping, hand-painted vistas meet an intimate story of inheritance.',
 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Adventure', '2026-06-12', 134,
 'https://picsum.photos/seed/cartographer/640/800'),
('Salt & Static',
 'A documentary crew chasing a vanishing radio signal across the salt flats finds something listening back. A taut, atmospheric horror about the noise between stations.',
 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Horror', '2026-05-30', 97,
 'https://picsum.photos/seed/static/640/800');

-- ── Shows ─────────────────────────────────────────────────────────────────
-- Helper: schedule each movie at a few slots over the next days.
insert into shows(movie_id, screen_name, start_time, end_time, price)
select m.id, v.screen_name,
       (date_trunc('day', now()) + v.day_offset + v.slot) as start_time,
       (date_trunc('day', now()) + v.day_offset + v.slot + (m.duration || ' minutes')::interval) as end_time,
       v.price
from movies m
cross join lateral (
  values
    ('Hall A',      interval '0 day', interval '14 hours', 12.00),
    ('Hall A',      interval '0 day', interval '19 hours', 14.00),
    ('IMAX Screen', interval '1 day', interval '20 hours', 22.00),
    ('Hall A',      interval '2 day', interval '16 hours', 12.00)
) as v(screen_name, day_offset, slot, price);

-- ── show_seats: one row per (show, seat) on the matching screen ─────────────
insert into show_seats(show_id, seat_id)
select sh.id, se.id
from shows sh
join seats se on se.screen_name = sh.screen_name;
