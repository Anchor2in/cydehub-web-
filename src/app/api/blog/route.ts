import { NextResponse } from "next/server";
import { getAggregatedBlogPosts } from "@/lib/blog/aggregate";

export async function GET() {
  const posts = await getAggregatedBlogPosts(120);
  return NextResponse.json({ posts });
}
