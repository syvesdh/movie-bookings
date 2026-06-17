// Four fixed vertical gridlines spanning the viewport — the architectural
// editorial-magazine signature. Aligned to the max-w-[1600px] container edges
// and middle thirds. Pointer-events disabled, hidden on small screens.
export function GridLines() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 hidden lg:block"
    >
      <div className="mx-auto h-full max-w-[1600px] px-16">
        <div className="relative h-full">
          {["0%", "33.333%", "66.666%", "100%"].map((left) => (
            <span
              key={left}
              className="absolute top-0 h-full w-px bg-[#1a1a1a]/15"
              style={{ left }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
