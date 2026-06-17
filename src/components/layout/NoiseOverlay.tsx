// Subtle paper-grain texture across the whole page (~2.5% opacity) to give the
// "expensive paper" tactile quality. Fixed, pointer-events disabled, high z.
const SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`;
const NOISE = `data:image/svg+xml,${encodeURIComponent(SVG)}`;

export function NoiseOverlay() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-50 opacity-[0.025] mix-blend-multiply"
      style={{ backgroundImage: `url("${NOISE}")`, backgroundSize: "160px" }}
    />
  );
}
