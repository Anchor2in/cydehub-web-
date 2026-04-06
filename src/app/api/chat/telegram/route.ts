import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateForumThreadId } from "@/lib/telegram/forum";

export const runtime = "nodejs";

type ForwardBody = {
  roomId?: string;
  content?: string;
};

function requiredTelegramEnv() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    return null;
  }

  return { botToken, chatId };
}

export async function POST(request: Request) {
  const env = requiredTelegramEnv();
  if (!env) {
    return NextResponse.json(
      { error: "Telegram is not configured. Missing required environment variables." },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as ForwardBody;
  const content = body.content?.trim();
  const roomId = body.roomId?.trim();

  if (!content || !roomId) {
    return NextResponse.json({ error: "roomId and content are required." }, { status: 400 });
  }

  const { data: profile } = await supabase.from("profiles").select("username").eq("id", user.id).maybeSingle();
  const username = profile?.username?.trim() || `user-${user.id.slice(0, 8)}`;

  const threadId = await getOrCreateForumThreadId({
    botToken: env.botToken,
    chatId: env.chatId,
    roomId,
    username,
    createdBy: user.id,
  });

  const text = `${username}: ${content}`;

  const upstream = await fetch(`https://api.telegram.org/bot${env.botToken}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: env.chatId,
      ...(threadId ? { message_thread_id: threadId } : {}),
      text,
    }),
  });

  if (!upstream.ok) {
    const upstreamError = await upstream.text();
    return NextResponse.json(
      { error: "Could not forward message to Telegram.", details: upstreamError },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
