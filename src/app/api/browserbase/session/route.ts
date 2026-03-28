import { Browserbase } from "@browserbasehq/sdk";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  const apiKey = process.env.BROWSERBASE_API_KEY;
  const projectId = process.env.BROWSERBASE_PROJECT_ID;

  if (!apiKey || !projectId) {
    return NextResponse.json(
      { error: "Missing BROWSERBASE_API_KEY or BROWSERBASE_PROJECT_ID" },
      { status: 500 },
    );
  }

  const bb = new Browserbase({ apiKey });

  try {
    const session = await bb.sessions.create({
      projectId,
    });

    return NextResponse.json({ session });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
