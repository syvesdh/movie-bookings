// Client-side fetch helpers used by Client Components / React Query.
import type { SeatMap, LockResponse } from "./types";

async function jsonOrThrow<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body?.error ?? `Request failed (${res.status})`);
    // @ts-expect-error attach status for callers
    err.status = res.status;
    throw err;
  }
  return body as T;
}

export async function fetchSeatMap(showId: string): Promise<SeatMap> {
  const res = await fetch(`/api/v1/shows/${showId}/seats`, {
    cache: "no-store",
  });
  return jsonOrThrow<SeatMap>(res);
}

export async function lockSeats(
  showId: string,
  seatIds: string[],
): Promise<LockResponse> {
  const res = await fetch(`/api/v1/bookings/lock`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ show_id: showId, seat_ids: seatIds }),
  });
  return jsonOrThrow<LockResponse>(res);
}

export async function payBooking(
  bookingId: string,
  paymentToken: string,
): Promise<{ booking_id: string; status: string }> {
  const res = await fetch(`/api/v1/bookings/${bookingId}/payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ payment_token: paymentToken }),
  });
  return jsonOrThrow(res);
}
