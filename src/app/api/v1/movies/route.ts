import { NextRequest, NextResponse } from "next/server";
import { getMovies } from "@/lib/data";

export const dynamic = "force-dynamic";

// GET /api/v1/movies?name=&genre=
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  try {
    const movies = await getMovies({
      name: searchParams.get("name") ?? undefined,
      genre: searchParams.get("genre") ?? undefined,
    });
    return NextResponse.json(movies);
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message ?? "Failed to load movies" },
      { status: 500 },
    );
  }
}
