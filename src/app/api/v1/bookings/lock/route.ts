import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getOrCreateUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

// POST /api/v1/bookings/lock  { show_id, seat_ids: [show_seat_id, ...] }
// Calls the atomic lock_seats() RPC. Returns 409 if any seat is already taken.
export async function POST(req: Request) {
  let body: { show_id?: string; seat_ids?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { show_id, seat_ids } = body;
  if (!show_id || !Array.isArray(seat_ids) || seat_ids.length === 0) {
    return NextResponse.json(
      { error: "show_id and a non-empty seat_ids array are required" },
      { status: 400 },
    );
  }

  const userId = await getOrCreateUserId();

  const { data, error } = await supabaseAdmin.rpc("lock_seats", {
    p_show_id: show_id,
    p_seat_ids: seat_ids,
    p_user_id: userId,
  });

  if (error) {
    if (error.message?.includes("SEATS_UNAVAILABLE")) {
      return NextResponse.json(
        { error: "Seats no longer available" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: error.message ?? "Failed to lock seats" },
      { status: 500 },
    );
  }

  const row = Array.isArray(data) ? data[0] : data;
  return NextResponse.json({
    booking_id: row.booking_id,
    status: "PENDING_PAYMENT",
    expires_at: row.expires_at,
    total_price: row.total_price,
  });
}
