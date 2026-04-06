import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  void request;
  return NextResponse.json(
    {
      error: "This bridge is disabled.",
      use: "/api/chat/telegram",
    },
    { status: 410 },
  );
}
