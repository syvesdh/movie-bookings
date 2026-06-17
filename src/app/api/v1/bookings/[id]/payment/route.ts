import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

// POST /api/v1/bookings/{id}/payment  { payment_token }
// MOCK gateway: any token confirms the booking, except the magic decline
// token "tok_decline" which simulates a failed charge (seats stay LOCKED
// until the TTL expires, exactly like a real abandoned payment).
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let body: { payment_token?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const token = body.payment_token;
  if (!token) {
    return NextResponse.json(
      { error: "payment_token is required" },
      { status: 400 },
    );
  }

  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "No session" }, { status: 401 });
  }

  // Simulated decline.
  if (token === "tok_decline") {
    return NextResponse.json(
      { error: "Your card was declined. Please try another card." },
      { status: 402 },
    );
  }

  const { data, error } = await supabaseAdmin.rpc("confirm_booking", {
    p_booking_id: id,
    p_user_id: userId,
  });

  if (error) {
    if (error.message?.includes("BOOKING_NOT_PENDING")) {
      return NextResponse.json(
        { error: "This reservation has expired. Please start again." },
        { status: 410 },
      );
    }
    if (error.message?.includes("BOOKING_NOT_FOUND")) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: error.message ?? "Payment failed" },
      { status: 500 },
    );
  }

  const row = Array.isArray(data) ? data[0] : data;
  return NextResponse.json({ booking_id: id, status: row?.status ?? "CONFIRMED" });
}
