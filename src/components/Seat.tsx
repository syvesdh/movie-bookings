"use client";

import type { SeatStatus } from "@/lib/types";

interface SeatProps {
  label: string;
  status: SeatStatus;
  selected: boolean;
  onToggle: () => void;
}

// A single rectangular seat. Architectural, 0px radius.
//   AVAILABLE → charcoal outline, transparent
//   SELECTED  → gold fill
//   LOCKED/BOOKED → taupe fill, disabled
export function Seat({ label, status, selected, onToggle }: SeatProps) {
  const taken = status === "LOCKED" || status === "BOOKED";

  let cls =
    "flex h-9 w-9 items-center justify-center border text-[10px] font-medium tracking-wider transition-all duration-300 md:h-10 md:w-10 ";
  if (taken) {
    cls +=
      "cursor-not-allowed border-[#ebe5de] bg-[#ebe5de] text-[#6c6863]/50";
  } else if (selected) {
    cls +=
      "border-[#d4af37] bg-[#d4af37] text-[#1a1a1a] shadow-[0_2px_8px_rgba(212,175,55,0.4)]";
  } else {
    cls +=
      "cursor-pointer border-[#1a1a1a]/40 bg-transparent text-[#1a1a1a] hover:border-[#1a1a1a] hover:bg-[#1a1a1a]/5";
  }

  return (
    <button
      type="button"
      disabled={taken}
      onClick={onToggle}
      aria-pressed={selected}
      aria-label={`Seat ${label}${taken ? " (unavailable)" : ""}`}
      title={label}
      className={cls}
    >
      {label}
    </button>
  );
}
