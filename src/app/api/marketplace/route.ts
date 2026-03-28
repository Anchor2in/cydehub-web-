import { NextResponse } from "next/server";
import { getAggregatedMarketplaceItems } from "@/lib/marketplace/aggregate";

export async function GET() {
  const items = await getAggregatedMarketplaceItems(140);
  return NextResponse.json({ items });
}
