import { notFound, redirect } from "next/navigation";
import { getBooking } from "@/lib/data";
import { getUserId } from "@/lib/session";
import { BookingFlow } from "@/components/BookingFlow";

export const dynamic = "force-dynamic";

export default async function BookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await getUserId();
  if (!userId) notFound();

  const booking = await getBooking(id, userId).catch(() => null);
  if (!booking) notFound();

  // Already paid — jump straight to the ticket.
  if (booking.status === "CONFIRMED") {
    redirect(`/booking/${id}/confirmed`);
  }

  return (
    <div className="mx-auto max-w-[1600px] px-8 py-12 md:px-16 md:py-20">
      <BookingFlow booking={booking} />
    </div>
  );
}
