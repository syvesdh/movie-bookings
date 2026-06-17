import { NextResponse } from "next/server";
import { getSeatMap } from "@/lib/data";

export const dynamic = "force-dynamic";

// GET /api/v1/shows/{id}/seats
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const map = await getSeatMap(id);
    if (!map) {
      return NextResponse.json({ error: "Show not found" }, { status: 404 });
    }
    return NextResponse.json(map);
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message ?? "Failed to load seats" },
      { status: 500 },
    );
  }
}
