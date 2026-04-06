import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateForumThreadId } from "@/lib/telegram/forum";

export const runtime = "nodejs";

const MAX_MEDIA_BYTES = 20 * 1024 * 1024;

type MediaKind = "photo" | "video" | "voice";

function requiredTelegramEnv() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    return null;
  }

  return { botToken, chatId };
}

function isMediaKind(value: string): value is MediaKind {
  return value === "photo" || value === "video" || value === "voice";
}

function sendMethodFor(kind: MediaKind) {
  if (kind === "photo") return { method: "sendPhoto", field: "photo" as const };
  if (kind === "video") return { method: "sendVideo", field: "video" as const };
  return { method: "sendVoice", field: "voice" as const };
}

function extractFileId(kind: MediaKind, payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;

  const result = (payload as { result?: unknown }).result;
  if (!result || typeof result !== "object") return null;

  if (kind === "photo") {
    const photos = (result as { photo?: Array<{ file_id?: string }> }).photo;
    if (!photos || photos.length === 0) return null;
    return photos[photos.length - 1]?.file_id ?? null;
  }

  if (kind === "video") {
    return (result as { video?: { file_id?: string } }).video?.file_id ?? null;
  }

  return (result as { voice?: { file_id?: string } }).voice?.file_id ?? null;
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

  const formData = await request.formData();
  const roomId = `${formData.get("roomId") ?? ""}`.trim();
  const kindValue = `${formData.get("kind") ?? ""}`.trim();
  const file = formData.get("file");

  if (!roomId || !kindValue || !(file instanceof File) || !isMediaKind(kindValue)) {
    return NextResponse.json({ error: "roomId, kind, and file are required." }, { status: 400 });
  }

  if (file.size > MAX_MEDIA_BYTES) {
    return NextResponse.json({ error: "Media must be less than 20MB." }, { status: 400 });
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

  const kind = kindValue;
  const endpoint = sendMethodFor(kind);

  const caption = `${username}`;
  const upstreamBody = new FormData();
  upstreamBody.append("chat_id", env.chatId);
  if (threadId) {
    upstreamBody.append("message_thread_id", `${threadId}`);
  }
  upstreamBody.append(endpoint.field, file, file.name);
  upstreamBody.append("caption", caption);

  const upstream = await fetch(`https://api.telegram.org/bot${env.botToken}/${endpoint.method}`, {
    method: "POST",
    body: upstreamBody,
  });

  if (!upstream.ok) {
    const upstreamError = await upstream.text();
    return NextResponse.json({ error: "Could not send media to Telegram.", details: upstreamError }, { status: 502 });
  }

  const upstreamPayload = (await upstream.json()) as unknown;
  const fileId = extractFileId(kind, upstreamPayload);

  if (!fileId) {
    return NextResponse.json({ error: "Telegram response did not include a media file id." }, { status: 502 });
  }

  return NextResponse.json({ ok: true, content: `[MEDIA:${kind}:${fileId}]` });
}
