import { NextResponse } from "next/server";
import { getMovieWithShows } from "@/lib/data";

export const dynamic = "force-dynamic";

// GET /api/v1/movies/{id}
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const movie = await getMovieWithShows(id);
    if (!movie) {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 });
    }
    return NextResponse.json(movie);
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message ?? "Failed to load movie" },
      { status: 500 },
    );
  }
}
