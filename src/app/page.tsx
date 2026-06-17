import { getMovies } from "@/lib/data";
import { MovieCard } from "@/components/MovieCard";
import { Overline } from "@/components/ui/Overline";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let movies: Awaited<ReturnType<typeof getMovies>> = [];
  let error: string | null = null;
  try {
    movies = await getMovies();
  } catch (e) {
    error = (e as Error).message;
  }

  return (
    <div className="mx-auto max-w-[1600px] px-8 md:px-16">
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 gap-12 py-20 md:grid-cols-12 md:py-32">
        <div className="md:col-span-10 md:col-start-2">
          <Overline rule>The Programme — 2026</Overline>
          <h1 className="mt-8 font-serif text-5xl leading-[0.9] tracking-tight sm:text-7xl md:text-8xl lg:text-9xl">
            Cinema, <span className="italic text-[#d4af37]">curated</span>
            <br />
            for the patient eye.
          </h1>
          <p className="mt-10 max-w-xl text-base leading-relaxed text-[#6c6863] md:text-lg">
            A small, deliberate selection of films — each shown on a single
            screen, each seat reserved with care. Choose slowly. The best seats
            are worth the wait.
          </p>
        </div>
      </section>

      {/* ── Movie grid ───────────────────────────────────────────────── */}
      <section className="border-t border-[#1a1a1a] py-16 md:py-24">
        <div className="mb-12 flex items-end justify-between">
          <Overline>Now Showing</Overline>
          <span className="overline text-[#6c6863]">
            {movies.length} {movies.length === 1 ? "Film" : "Films"}
          </span>
        </div>

        {error && (
          <div className="border-t border-[#d4af37] py-12">
            <p className="font-serif text-2xl">The programme is unavailable.</p>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-[#6c6863]">
              The database isn&apos;t connected yet. Add your Supabase
              credentials to <code>.env.local</code> and run the SQL in{" "}
              <code>supabase/</code>. Details: {error}
            </p>
          </div>
        )}

        {!error && movies.length === 0 && (
          <p className="font-serif text-2xl text-[#6c6863]">
            No films are currently scheduled.
          </p>
        )}

        <div className="grid grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
          {movies.map((m, i) => (
            <div key={m.id} className={i % 3 === 1 ? "lg:mt-16" : undefined}>
              <MovieCard movie={m} index={i} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
