"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fetchSeatMap, lockSeats } from "@/lib/api";
import type { SeatCell } from "@/lib/types";
import { Seat } from "./Seat";
import { Button } from "./ui/Button";
import { Overline } from "./ui/Overline";
import { formatPrice, formatShowTime } from "@/lib/format";

export function SeatMap({ showId }: { showId: string }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [locking, setLocking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Poll every 5s so other patrons' locks/bookings appear live.
  const { data, isLoading, isError } = useQuery({
    queryKey: ["seatmap", showId],
    queryFn: () => fetchSeatMap(showId),
    refetchInterval: 5000,
  });

  const seatByKey = useMemo(() => {
    const m = new Map<string, SeatCell>();
    data?.seats.forEach((s) => m.set(`${s.row_num}${s.col_num}`, s));
    return m;
  }, [data]);

  // Drop any selected seats that have since been taken by someone else.
  const liveSelected = useMemo(() => {
    const next = new Set<string>();
    selected.forEach((id) => {
      const cell = data?.seats.find((s) => s.show_seat_id === id);
      if (cell && cell.status === "AVAILABLE") next.add(id);
    });
    return next;
  }, [selected, data]);

  function toggle(cell: SeatCell) {
    setError(null);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(cell.show_seat_id)) next.delete(cell.show_seat_id);
      else next.add(cell.show_seat_id);
      return next;
    });
  }

  async function handleLock() {
    if (liveSelected.size === 0) return;
    setLocking(true);
    setError(null);
    try {
      const res = await lockSeats(showId, [...liveSelected]);
      router.push(`/booking/${res.booking_id}`);
    } catch (e) {
      const status = (e as { status?: number }).status;
      setError(
        status === 409
          ? "One or more of those seats was just taken. Please choose again."
          : (e as Error).message,
      );
      setSelected(new Set());
      setLocking(false);
    }
  }

  if (isLoading) {
    return (
      <p className="font-serif text-2xl italic text-[#6c6863]">
        Preparing the auditorium…
      </p>
    );
  }
  if (isError || !data) {
    return (
      <div className="border-t border-[#d4af37] py-10">
        <p className="font-serif text-2xl">This auditorium is unavailable.</p>
        <p className="mt-2 text-sm text-[#6c6863]">
          Ensure the database is connected and seeded.
        </p>
      </div>
    );
  }

  const price = data.show.price;
  const total = liveSelected.size * Number(price);

  return (
    <div>
      <div className="mb-2">
        <Overline rule>{data.show.movie_title}</Overline>
      </div>
      <div className="mb-12 flex flex-wrap items-baseline gap-x-6 gap-y-1">
        <span className="overline text-[#6c6863]">{data.screen_name}</span>
        <span className="h-px w-8 bg-[#1a1a1a]/30" />
        <span className="overline text-[#6c6863]">
          {formatShowTime(data.show.start_time)}
        </span>
      </div>

      {/* Screen indicator */}
      <div className="mx-auto mb-2 max-w-3xl">
        <div className="mx-auto h-px w-full max-w-2xl bg-gradient-to-r from-transparent via-[#1a1a1a]/60 to-transparent" />
        <p className="overline mt-3 text-center text-[#6c6863]">Screen</p>
      </div>

      {/* Seat grid */}
      <div className="mt-10 overflow-x-auto pb-4">
        <div className="mx-auto flex w-fit flex-col gap-2">
          {data.rows.map((row) => (
            <div key={row} className="flex items-center gap-2">
              <span className="w-5 text-right text-[10px] font-medium text-[#6c6863]">
                {row}
              </span>
              <div className="flex gap-2">
                {data.cols.map((col) => {
                  const cell = seatByKey.get(`${row}${col}`);
                  if (!cell)
                    return <span key={col} className="h-9 w-9 md:h-10 md:w-10" />;
                  return (
                    <Seat
                      key={col}
                      label={`${row}${col}`}
                      status={cell.status}
                      selected={liveSelected.has(cell.show_seat_id)}
                      onToggle={() => toggle(cell)}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-10 flex flex-wrap justify-center gap-8">
        <Legend swatch="border border-[#1a1a1a]/40 bg-transparent" label="Available" />
        <Legend swatch="bg-[#d4af37]" label="Selected" />
        <Legend swatch="bg-[#ebe5de]" label="Taken" />
      </div>

      {/* Summary bar */}
      <div className="mt-12 border-t border-[#1a1a1a] pt-8">
        {error && (
          <p className="mb-6 font-serif text-lg italic text-[#d4af37]">
            {error}
          </p>
        )}
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="overline">
              {liveSelected.size}{" "}
              {liveSelected.size === 1 ? "Seat" : "Seats"} Selected
            </p>
            <p className="mt-2 font-serif text-4xl md:text-5xl">
              {formatPrice(total)}
            </p>
          </div>
          <Button
            onClick={handleLock}
            disabled={liveSelected.size === 0 || locking}
            size="lg"
          >
            {locking ? "Holding your seats…" : "Reserve & Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="flex items-center gap-3">
      <span className={`h-4 w-4 ${swatch}`} />
      <span className="overline text-[#6c6863]">{label}</span>
    </span>
  );
}
