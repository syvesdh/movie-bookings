import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getMovieWithShows } from "@/lib/data";
import { ShowtimePicker } from "@/components/ShowtimePicker";
import { Overline } from "@/components/ui/Overline";
import { formatRuntime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function MoviePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const movie = await getMovieWithShows(id).catch(() => null);
  if (!movie) notFound();

  const year = movie.release_date
    ? new Date(movie.release_date).getFullYear()
    : "";

  return (
    <div className="mx-auto max-w-[1600px] px-8 py-12 md:px-16 md:py-20">
      <Link
        href="/"
        className="overline transition-colors duration-500 hover:text-[#d4af37]"
      >
        ← The Programme
      </Link>

      <div className="mt-10 grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-16">
        {/* Poster */}
        <div className="md:col-span-5">
          <div className="group relative overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
            <div className="pointer-events-none absolute inset-0 z-20 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)]" />
            <span className="vertical-label absolute left-3 top-4 z-20 text-[#f9f8f6] mix-blend-difference">
              Feature Presentation
            </span>
            {movie.poster_url && (
              <Image
                src={movie.poster_url}
                alt={movie.title}
                width={640}
                height={800}
                unoptimized
                className="aspect-[4/5] w-full object-cover grayscale transition-all duration-[1800ms] ease-out group-hover:scale-105 group-hover:grayscale-0"
              />
            )}
          </div>
        </div>

        {/* Details */}
        <div className="md:col-span-7 md:pt-6">
          <Overline rule>{movie.genre}</Overline>
          <h1 className="mt-6 font-serif text-5xl leading-[0.95] tracking-tight md:text-7xl">
            {movie.title}
          </h1>

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
            <span className="overline text-[#6c6863]">{year}</span>
            <span className="h-px w-8 bg-[#1a1a1a]/30" />
            <span className="overline text-[#6c6863]">
              {formatRuntime(movie.duration)}
            </span>
            {movie.trailer_url && (
              <>
                <span className="h-px w-8 bg-[#1a1a1a]/30" />
                <a
                  href={movie.trailer_url}
                  target="_blank"
                  rel="noreferrer"
                  className="overline transition-colors duration-500 hover:text-[#d4af37]"
                >
                  Watch Trailer ↗
                </a>
              </>
            )}
          </div>

          {movie.description && (
            <p className="dropcap mt-10 max-w-xl text-base leading-relaxed text-[#1a1a1a] md:text-lg">
              {movie.description}
            </p>
          )}

          <div className="mt-14">
            <Overline className="mb-8 block">Select a Showtime</Overline>
            <ShowtimePicker shows={movie.shows} />
          </div>
        </div>
      </div>
    </div>
  );
}
