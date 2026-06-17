import Link from "next/link";
import Image from "next/image";
import type { Movie } from "@/lib/types";
import { formatRuntime } from "@/lib/format";

// Editorial movie card: large portrait poster, grayscale that reveals colour
// on hover over ~1.6s, with a slow scale. Title in serif; meta in overline.
export function MovieCard({ movie, index }: { movie: Movie; index: number }) {
  const vol = String(index + 1).padStart(2, "0");
  return (
    <Link href={`/movies/${movie.id}`} className="group block">
      <div className="relative overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.08)] transition-shadow duration-700 group-hover:shadow-[0_12px_40px_rgba(0,0,0,0.16)]">
        {/* inner border frame */}
        <div className="pointer-events-none absolute inset-0 z-20 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)]" />
        {/* vertical decorative label */}
        <span className="vertical-label absolute left-3 top-4 z-20 text-[#f9f8f6] mix-blend-difference">
          Now Showing / {vol}
        </span>
        {movie.poster_url && (
          <Image
            src={movie.poster_url}
            alt={movie.title}
            width={640}
            height={800}
            className="aspect-[4/5] w-full object-cover grayscale transition-all duration-[1600ms] ease-out group-hover:scale-105 group-hover:grayscale-0"
            unoptimized
          />
        )}
      </div>
      <div className="mt-5 border-t border-[#1a1a1a] pt-4">
        <div className="flex items-baseline justify-between gap-4">
          <span className="overline">{movie.genre}</span>
          <span className="overline text-[#6c6863]">
            {formatRuntime(movie.duration)}
          </span>
        </div>
        <h3 className="mt-3 font-serif text-2xl leading-tight transition-colors duration-500 group-hover:text-[#d4af37] md:text-3xl">
          {movie.title}
        </h3>
      </div>
    </Link>
  );
}
