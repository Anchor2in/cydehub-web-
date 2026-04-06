import { createAdminClient } from "@/lib/supabase/admin";

type TelegramResult = {
  message_thread_id?: number;
};

type TelegramResponse = {
  ok?: boolean;
  result?: TelegramResult;
  description?: string;
};

const FORUM_ENABLED = process.env.TELEGRAM_FORUM_ENABLED === "true";

export function isTelegramForumEnabled() {
  return FORUM_ENABLED;
}

function topicNameFor(username: string) {
  const clean = username.trim().replace(/\s+/g, " ").slice(0, 64);
  return clean ? `@${clean}` : "CydeHub User";
}

export async function getOrCreateForumThreadId(params: {
  botToken: string;
  chatId: string;
  roomId: string;
  username: string;
  createdBy: string;
}) {
  if (!isTelegramForumEnabled()) {
    return null;
  }

  const admin = createAdminClient();
  const { data: existing, error: existingError } = await admin
    .from("chat_telegram_topics")
    .select("thread_id")
    .eq("room_id", params.roomId)
    .maybeSingle();

  if (existingError) {
    throw new Error("Telegram forum mapping table is missing. Apply latest database schema.");
  }

  if (existing?.thread_id) {
    return existing.thread_id;
  }

  const topicName = topicNameFor(params.username);
  const createTopic = await fetch(`https://api.telegram.org/bot${params.botToken}/createForumTopic`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: params.chatId,
      name: topicName,
    }),
  });

  const topicPayload = (await createTopic.json().catch(() => null)) as TelegramResponse | null;
  const threadId = topicPayload?.result?.message_thread_id;

  if (!createTopic.ok || !threadId) {
    throw new Error(topicPayload?.description || "Could not create Telegram forum topic.");
  }

  const { error: saveError } = await admin.from("chat_telegram_topics").upsert({
    room_id: params.roomId,
    thread_id: threadId,
    created_by: params.createdBy,
    topic_name: topicName,
  });

  if (saveError) {
    throw new Error(saveError.message);
  }

  return threadId;
}

export async function resolveRoomIdByThreadId(threadId: number) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("chat_telegram_topics")
    .select("room_id")
    .eq("thread_id", threadId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data?.room_id ?? null;
}
