import { SeatMap } from "@/components/SeatMap";

export const dynamic = "force-dynamic";

export default async function ShowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="mx-auto max-w-[1600px] px-8 py-12 md:px-16 md:py-20">
      <SeatMap showId={id} />
    </div>
  );
}
