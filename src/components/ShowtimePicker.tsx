import Link from "next/link";
import type { Show } from "@/lib/types";
import { formatDayLabel, formatPrice } from "@/lib/format";

// Groups a movie's shows by calendar day and renders each slot as a chip
// that links into the seat-selection page.
export function ShowtimePicker({ shows }: { shows: Show[] }) {
  if (shows.length === 0) {
    return (
      <p className="font-serif text-xl italic text-[#6c6863]">
        No showtimes scheduled.
      </p>
    );
  }

  const byDay = new Map<string, Show[]>();
  for (const s of shows) {
    const key = new Date(s.start_time).toDateString();
    (byDay.get(key) ?? byDay.set(key, []).get(key)!).push(s);
  }

  return (
    <div className="flex flex-col gap-12">
      {[...byDay.entries()].map(([day, slots]) => (
        <div key={day} className="border-t border-[#1a1a1a]/15 pt-6">
          <p className="overline mb-5">{formatDayLabel(slots[0].start_time)}</p>
          <div className="flex flex-wrap gap-4">
            {slots.map((s) => {
              const time = new Date(s.start_time).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              });
              return (
                <Link
                  key={s.id}
                  href={`/shows/${s.id}`}
                  className="group flex min-w-[8rem] flex-col gap-1 border border-[#1a1a1a] px-6 py-4 transition-colors duration-500 hover:bg-[#1a1a1a] hover:text-[#f9f8f6]"
                >
                  <span className="font-serif text-xl">{time}</span>
                  <span className="overline transition-colors group-hover:text-[#d4af37]">
                    {s.screen_name}
                  </span>
                  <span className="mt-1 text-xs text-[#6c6863] transition-colors group-hover:text-[#ebe5de]">
                    {formatPrice(s.price)} / seat
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
