import { NextResponse } from "next/server";
import { getAggregatedTournamentPosts } from "@/lib/tournaments/aggregate";

export async function GET() {
  const items = await getAggregatedTournamentPosts(80);
  return NextResponse.json({ items });
}
