"use client";

import { useEffect, useState } from "react";

// Counts down to `expiresAt`. Turns gold and "urgent" under 2 minutes.
// Fires onExpire once when it hits zero.
export function CountdownTimer({
  expiresAt,
  onExpire,
}: {
  expiresAt: string;
  onExpire?: () => void;
}) {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, new Date(expiresAt).getTime() - Date.now()),
  );

  useEffect(() => {
    const target = new Date(expiresAt).getTime();
    const tick = () => {
      const ms = Math.max(0, target - Date.now());
      setRemaining(ms);
      if (ms <= 0) onExpire?.();
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  const totalSec = Math.floor(remaining / 1000);
  const mm = String(Math.floor(totalSec / 60)).padStart(2, "0");
  const ss = String(totalSec % 60).padStart(2, "0");
  const urgent = remaining > 0 && remaining < 120_000;

  return (
    <div className="flex flex-col gap-2">
      <span className="overline">Seats held for</span>
      <span
        className={`font-serif text-5xl tabular-nums tracking-tight transition-colors duration-700 md:text-6xl ${
          urgent ? "text-[#d4af37]" : "text-[#1a1a1a]"
        }`}
      >
        {mm}:{ss}
      </span>
      {urgent && (
        <span className="overline text-[#d4af37]">
          Complete payment soon
        </span>
      )}
    </div>
  );
}
