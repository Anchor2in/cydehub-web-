import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isTelegramForumEnabled, resolveRoomIdByThreadId } from "@/lib/telegram/forum";

export const runtime = "nodejs";

const MAX_MEDIA_BYTES = 20 * 1024 * 1024;

type TelegramUpdate = {
  message?: {
    text?: string;
    caption?: string;
    photo?: Array<{ file_id?: string; file_size?: number }>;
    video?: { file_id?: string; file_size?: number };
    voice?: { file_id?: string; file_size?: number };
    message_thread_id?: number;
    reply_to_message?: {
      text?: string;
      caption?: string;
    };
  };
  channel_post?: {
    text?: string;
    caption?: string;
    photo?: Array<{ file_id?: string; file_size?: number }>;
    video?: { file_id?: string; file_size?: number };
    voice?: { file_id?: string; file_size?: number };
    message_thread_id?: number;
  };
};

type TelegramMessagePayload = {
  text?: string;
  caption?: string;
  photo?: Array<{ file_id?: string; file_size?: number }>;
  video?: { file_id?: string; file_size?: number };
  voice?: { file_id?: string; file_size?: number };
  message_thread_id?: number;
  reply_to_message?: {
    text?: string;
    caption?: string;
  };
};

type ExtractedInbound = {
  content: string;
  roomIdHint: string | null;
  threadId: number | null;
};

function extractRoomIdFromText(text?: string | null): string | null {
  if (!text) return null;
  const match = text.match(/RoomId:([0-9a-fA-F-]{36})/);
  return match?.[1] ?? null;
}

function mediaContent(kind: "photo" | "video" | "voice", fileId: string, caption?: string) {
  const cleanCaption = caption?.trim() ?? "";
  return cleanCaption ? `[Telegram][MEDIA:${kind}:${fileId}] ${cleanCaption}` : `[Telegram][MEDIA:${kind}:${fileId}]`;
}

function extractContentFromMessage(message?: TelegramMessagePayload): ExtractedInbound | null {
  if (!message) return null;

  const roomIdHint =
    extractRoomIdFromText(message.reply_to_message?.text) ?? extractRoomIdFromText(message.reply_to_message?.caption);
  const threadId = typeof message.message_thread_id === "number" ? message.message_thread_id : null;

  const photos = message.photo ?? [];
  const photo = photos[photos.length - 1];
  if (photo?.file_id && (photo.file_size ?? 0) <= MAX_MEDIA_BYTES) {
    return { content: mediaContent("photo", photo.file_id, message.caption), roomIdHint, threadId };
  }

  const video = message.video;
  if (video?.file_id && (video.file_size ?? 0) <= MAX_MEDIA_BYTES) {
    return { content: mediaContent("video", video.file_id, message.caption), roomIdHint, threadId };
  }

  const voice = message.voice;
  if (voice?.file_id && (voice.file_size ?? 0) <= MAX_MEDIA_BYTES) {
    return { content: mediaContent("voice", voice.file_id, message.caption), roomIdHint, threadId };
  }

  const text = message.text?.trim();
  if (text) {
    return { content: `[Telegram] ${text}`, roomIdHint, threadId };
  }

  return null;
}

function extractContents(payload: TelegramUpdate): ExtractedInbound[] {
  const values = [extractContentFromMessage(payload.message), extractContentFromMessage(payload.channel_post)];
  return values.filter((value): value is ExtractedInbound => Boolean(value));
}

async function resolveRoomAndSender(roomIdHint: string | null) {
  const admin = createAdminClient();
  const configuredRoomId = roomIdHint || process.env.TELEGRAM_DEFAULT_ROOM_ID;

  const baseQuery = admin.from("chat_rooms").select("id,created_by");
  const roomQuery = configuredRoomId
    ? baseQuery.eq("id", configuredRoomId).limit(1).maybeSingle()
    : baseQuery.order("created_at", { ascending: true }).limit(1).maybeSingle();

  const { data: room, error: roomError } = await roomQuery;

  if (roomError) {
    throw roomError;
  }

  if (!room) {
    return null;
  }

  const senderId = process.env.TELEGRAM_AGENT_USER_ID || room.created_by;

  return { admin, roomId: room.id, senderId };
}

function isSecretValid(request: Request): boolean {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!expected) return true;

  const provided = request.headers.get("x-telegram-bot-api-secret-token");
  return provided === expected;
}

export async function GET() {
  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  if (!isSecretValid(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json()) as TelegramUpdate;
  const messages = extractContents(payload);

  if (messages.length === 0) {
    return NextResponse.json({ received: true, inserted: 0 });
  }

  let inserted = 0;

  for (const message of messages) {
    let roomHint = message.roomIdHint;
    if (!roomHint && message.threadId && isTelegramForumEnabled()) {
      roomHint = await resolveRoomIdByThreadId(message.threadId);
    }

    const resolved = await resolveRoomAndSender(roomHint);
    if (!resolved) {
      continue;
    }

    const { error } = await resolved.admin.from("chat_messages").insert({
      room_id: resolved.roomId,
      sender_id: resolved.senderId,
      content: message.content,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    inserted += 1;
  }

  return NextResponse.json({ received: true, inserted });
}
