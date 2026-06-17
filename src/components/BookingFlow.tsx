"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { BookingDetail } from "@/lib/types";
import { CountdownTimer } from "./CountdownTimer";
import { MockPaymentForm } from "./MockPaymentForm";
import { ButtonLink } from "./ui/Button";
import { Overline } from "./ui/Overline";
import { payBooking } from "@/lib/api";
import { formatPrice, formatShowTime } from "@/lib/format";

export function BookingFlow({ booking }: { booking: BookingDetail }) {
  const router = useRouter();
  // Expiry is driven by the CountdownTimer, which fires onExpire on mount if
  // the hold is already past due (keeps impure Date.now() out of render).
  const [expired, setExpired] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const seatList = booking.seats
    .map((s) => `${s.row_num}${s.col_num}`)
    .join(", ");

  const handleExpire = useCallback(() => setExpired(true), []);

  async function handlePay(token: string) {
    setError(null);
    try {
      await payBooking(booking.id, token);
      router.push(`/booking/${booking.id}/confirmed`);
    } catch (e) {
      const status = (e as { status?: number }).status;
      if (status === 410) setExpired(true);
      setError((e as Error).message);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-16">
      {/* ── Order summary ──────────────────────────────────────────── */}
      <aside className="md:col-span-5">
        <Overline rule>Your Reservation</Overline>
        <div className="mt-8 flex gap-6">
          {booking.show.poster_url && (
            <Image
              src={booking.show.poster_url}
              alt={booking.show.movie_title}
              width={160}
              height={200}
              unoptimized
              className="h-40 w-32 flex-shrink-0 object-cover shadow-[0_4px_20px_rgba(0,0,0,0.1)] grayscale"
            />
          )}
          <div>
            <h2 className="font-serif text-2xl leading-tight md:text-3xl">
              {booking.show.movie_title}
            </h2>
            <p className="mt-3 text-sm text-[#6c6863]">
              {formatShowTime(booking.show.start_time)}
            </p>
            <p className="text-sm text-[#6c6863]">{booking.show.screen_name}</p>
          </div>
        </div>

        <dl className="mt-10 flex flex-col gap-4 border-t border-[#1a1a1a]/15 pt-8">
          <div className="flex justify-between">
            <dt className="overline text-[#6c6863]">Seats</dt>
            <dd className="text-sm font-medium">{seatList}</dd>
          </div>
          <div className="flex items-baseline justify-between border-t border-[#1a1a1a]/15 pt-4">
            <dt className="overline text-[#6c6863]">Total</dt>
            <dd className="font-serif text-3xl">
              {formatPrice(booking.total_price)}
            </dd>
          </div>
        </dl>
      </aside>

      {/* ── Timer + payment ────────────────────────────────────────── */}
      <section className="md:col-span-7 md:col-start-6">
        {expired ? (
          <div className="border-t-4 border-t-[#d4af37] pt-8">
            <h2 className="font-serif text-4xl leading-tight md:text-5xl">
              Your hold has <span className="italic text-[#d4af37]">expired.</span>
            </h2>
            <p className="mt-6 max-w-md text-base leading-relaxed text-[#6c6863]">
              We held these seats for ten minutes. They&apos;ve now been
              released back to the auditorium for other patrons. Please choose
              your seats again.
            </p>
            <div className="mt-10">
              <ButtonLink href={`/shows/${booking.show.id}`} variant="secondary">
                Back to Seat Selection
              </ButtonLink>
            </div>
          </div>
        ) : (
          <div className="border-t border-[#1a1a1a] pt-8">
            <CountdownTimer
              expiresAt={booking.expires_at}
              onExpire={handleExpire}
            />
            <div className="mt-12">
              <Overline className="mb-8 block">Payment</Overline>
              {error && (
                <p className="mb-6 font-serif text-lg italic text-[#d4af37]">
                  {error}
                </p>
              )}
              <MockPaymentForm onPay={handlePay} />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
