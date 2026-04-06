import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  void request;
  return NextResponse.json(
    {
      error: "This webhook is disabled.",
      use: "/api/telegram/webhook",
    },
    { status: 410 },
  );
}

export async function POST(request: Request) {
  void request;
  return NextResponse.json(
    {
      error: "This webhook is disabled.",
      use: "/api/telegram/webhook",
    },
    { status: 410 },
  );
}
