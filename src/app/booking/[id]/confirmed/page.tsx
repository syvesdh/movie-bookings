import Image from "next/image";
import { notFound } from "next/navigation";
import { getBooking } from "@/lib/data";
import { getUserId } from "@/lib/session";
import { ButtonLink } from "@/components/ui/Button";
import { Overline } from "@/components/ui/Overline";
import { formatPrice, formatShowTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ConfirmedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await getUserId();
  if (!userId) notFound();

  const booking = await getBooking(id, userId).catch(() => null);
  if (!booking) notFound();

  const seatList = booking.seats
    .map((s) => `${s.row_num}${s.col_num}`)
    .join(" · ");
  const ref = booking.id.slice(0, 8).toUpperCase();

  return (
    <div className="mx-auto max-w-[1600px] px-8 py-12 md:px-16 md:py-24">
      <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
        <div className="md:col-span-7 md:col-start-2">
          <Overline rule>
            {booking.status === "CONFIRMED"
              ? "Reservation Confirmed"
              : "Reservation"}
          </Overline>
          <h1 className="mt-8 font-serif text-5xl leading-[0.95] tracking-tight md:text-7xl">
            Your seats are
            <br />
            <span className="italic text-[#d4af37]">secured.</span>
          </h1>
          <p className="mt-8 max-w-md text-base leading-relaxed text-[#6c6863]">
            A quiet thank you. Present this reference at the door — no print
            required. We look forward to seeing you.
          </p>

          {/* Ticket */}
          <div className="mt-12 border-t-4 border-t-[#d4af37] bg-[#1a1a1a] p-8 text-[#f9f8f6] shadow-[0_8px_32px_rgba(0,0,0,0.18)] md:p-12">
            <div className="mb-8 flex items-center justify-between">
              <span className="font-serif text-lg">
                Steven<span className="italic text-[#d4af37]">&apos;s</span> Cinéma
              </span>
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#ebe5de]/60">
                Admit {/* seats count */}
                {booking.seats.length}
              </span>
            </div>
            <div className="flex items-start gap-6">
              {booking.show.poster_url && (
                <Image
                  src={booking.show.poster_url}
                  alt={booking.show.movie_title}
                  width={120}
                  height={150}
                  unoptimized
                  className="h-36 w-28 flex-shrink-0 object-cover grayscale"
                />
              )}
              <div className="min-w-0">
                <h2 className="font-serif text-3xl leading-tight md:text-4xl">
                  {booking.show.movie_title}
                </h2>
                <p className="mt-3 text-sm text-[#ebe5de]/80">
                  {formatShowTime(booking.show.start_time)}
                </p>
                <p className="text-sm text-[#ebe5de]/80">
                  {booking.show.screen_name}
                </p>
              </div>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-8 border-t border-[#f9f8f6]/20 pt-8">
              <Field label="Seats" value={seatList} />
              <Field label="Reference" value={ref} />
              <Field label="Paid" value={formatPrice(booking.total_price)} />
              <Field label="Status" value={booking.status} />
            </div>
          </div>

          <div className="mt-12">
            <ButtonLink href="/" variant="secondary">
              Back to the Programme
            </ButtonLink>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.25em] text-[#ebe5de]/60">
        {label}
      </p>
      <p className="mt-2 font-serif text-xl">{value}</p>
    </div>
  );
}
