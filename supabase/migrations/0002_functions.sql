-- Cinema Booking Platform — transactional functions (the core guarantee)
-- Run this after 0001_schema.sql.

-- Release expired holds for one show (lazy TTL enforcement).
create or replace function expire_stale_bookings(p_show_id uuid)
returns void as $$
begin
  update show_seats ss set status = 'AVAILABLE', version = version + 1
    from bookings b
    join booking_items bi on bi.booking_id = b.id
   where bi.show_seat_id = ss.id
     and b.show_id = p_show_id
     and b.status = 'PENDING_PAYMENT'
     and b.expires_at < now()
     and ss.status = 'LOCKED';

  update bookings
     set status = 'EXPIRED'
   where show_id = p_show_id
     and status = 'PENDING_PAYMENT'
     and expires_at < now();
end;
$$ language plpgsql security definer;

-- Atomically lock seats and create a PENDING_PAYMENT booking.
-- Uses SELECT ... FOR UPDATE pessimistic locking so no two callers
-- can grab the same seat. Raises SEATS_UNAVAILABLE if any seat is taken.
create or replace function lock_seats(
  p_show_id  uuid,
  p_seat_ids uuid[],
  p_user_id  uuid
)
returns table(booking_id uuid, expires_at timestamptz, total_price numeric) as $$
declare
  v_booking_id uuid;
  v_expires    timestamptz := now() + interval '10 minutes';
  v_price      numeric;
  v_available  int;
begin
  -- 1. Lazily release anything that has timed out for this show.
  perform expire_stale_bookings(p_show_id);

  -- 2. Pessimistically lock the requested rows for the duration of the txn.
  perform 1
    from show_seats
   where show_id = p_show_id
     and id = any(p_seat_ids)
   for update;

  -- 3. Verify every requested seat is still AVAILABLE.
  select count(*) into v_available
    from show_seats
   where show_id = p_show_id
     and id = any(p_seat_ids)
     and status = 'AVAILABLE';

  if v_available <> array_length(p_seat_ids, 1) then
    raise exception 'SEATS_UNAVAILABLE';
  end if;

  -- 4. Price = per-seat price of the show * number of seats.
  select s.price * array_length(p_seat_ids, 1) into v_price
    from shows s where s.id = p_show_id;

  -- 5. Flip to LOCKED and create the booking + items.
  update show_seats
     set status = 'LOCKED', version = version + 1
   where id = any(p_seat_ids);

  insert into bookings(user_id, show_id, status, expires_at, total_price)
  values (p_user_id, p_show_id, 'PENDING_PAYMENT', v_expires, v_price)
  returning id into v_booking_id;

  insert into booking_items(booking_id, show_seat_id)
  select v_booking_id, unnest(p_seat_ids);

  return query select v_booking_id, v_expires, v_price;
end;
$$ language plpgsql security definer;

-- Atomically confirm payment: PENDING_PAYMENT -> CONFIRMED, seats LOCKED -> BOOKED.
-- Raises BOOKING_NOT_PENDING if it already expired/confirmed.
create or replace function confirm_booking(p_booking_id uuid, p_user_id uuid)
returns table(booking_id uuid, status varchar) as $$
declare
  v_status     varchar;
  v_expires    timestamptz;
begin
  select status, expires_at into v_status, v_expires
    from bookings
   where id = p_booking_id and user_id = p_user_id
   for update;

  if v_status is null then
    raise exception 'BOOKING_NOT_FOUND';
  end if;

  if v_status <> 'PENDING_PAYMENT' or v_expires < now() then
    raise exception 'BOOKING_NOT_PENDING';
  end if;

  update show_seats ss
     set status = 'BOOKED', version = version + 1
    from booking_items bi
   where bi.booking_id = p_booking_id
     and bi.show_seat_id = ss.id;

  update bookings set status = 'CONFIRMED' where id = p_booking_id;

  return query select p_booking_id, 'CONFIRMED'::varchar;
end;
$$ language plpgsql security definer;
