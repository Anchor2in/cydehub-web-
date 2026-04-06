"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/toast";

type ChatMessage = {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  pending?: boolean;
};

type ChatRoom = {
  id: string;
  title: string | null;
};

type MediaKind = "photo" | "video" | "voice";

type ParsedMessage = {
  isTelegramReply: boolean;
  media: {
    kind: MediaKind;
    fileId: string;
  } | null;
  text: string;
};

const MAX_MEDIA_BYTES = 20 * 1024 * 1024;

export default function ChatPage() {
  const enabled = useMemo(() => hasSupabaseEnv(), []);
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const { toast } = useToast();
  const [activeChannel, setActiveChannel] = useState("general");
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const latestMessageAtRef = useRef<string | null>(null);
  const [attachOpen, setAttachOpen] = useState(false);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const voiceInputRef = useRef<HTMLInputElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recorderStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [recording, setRecording] = useState(false);

  const channels = useMemo(
    () => [
      { id: "general", label: "general" },
      { id: "business", label: "business" },
      { id: "helpline", label: "helpline" },
      { id: "chat", label: "chat" },
    ],
    [],
  );

  const roomTitle = room?.title ?? "General";

  function shortId(id: string) {
    if (!id) return "user";
    return id.length <= 10 ? id : `${id.slice(0, 6)}…${id.slice(-3)}`;
  }

  function initialsFrom(id: string) {
    const s = shortId(id).replaceAll("…", "");
    const a = s.slice(0, 2).toUpperCase();
    return a || "U";
  }

  function parseMessage(content: string): ParsedMessage {
    const isTelegramReply = content.startsWith("[Telegram]");
    const withoutTelegram = isTelegramReply ? content.replace(/^\[Telegram\]\s*/, "") : content;
    const mediaMatch = withoutTelegram.match(/^\[MEDIA:(photo|video|voice):([^\]]+)\]\s*([\s\S]*)$/);

    if (!mediaMatch) {
      return { isTelegramReply, media: null, text: withoutTelegram };
    }

    return {
      isTelegramReply,
      media: {
        kind: mediaMatch[1] as MediaKind,
        fileId: mediaMatch[2],
      },
      text: mediaMatch[3] ?? "",
    };
  }

  const mergeMessages = useCallback((prev: ChatMessage[], incoming: ChatMessage[]) => {
    const next = [...prev];

    for (const message of incoming) {
      const byIdIndex = next.findIndex((item) => item.id === message.id);
      if (byIdIndex >= 0) {
        next[byIdIndex] = message;
        continue;
      }

      const pendingIndex = next.findIndex(
        (item) => item.pending && item.sender_id === message.sender_id && item.content === message.content,
      );

      if (pendingIndex >= 0) {
        next[pendingIndex] = message;
        continue;
      }

      next.push(message);
    }

    next.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    return next;
  }, []);

  const applyIncomingMessages = useCallback((incoming: ChatMessage[]) => {
    if (incoming.length === 0) return;

    setMessages((prev) => {
      const merged = mergeMessages(prev, incoming);
      latestMessageAtRef.current = merged.at(-1)?.created_at ?? latestMessageAtRef.current;
      return merged;
    });
  }, [mergeMessages]);

  useEffect(() => {
    let cancelled = false;
    let teardown: (() => void) | undefined;
    let syncTimer: ReturnType<typeof setInterval> | undefined;

    async function run() {
      if (!enabled) {
        setStatus("Authentication is not configured yet.");
        return;
      }

      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setStatus("Sign in on /account to use chat.");
        return;
      }

      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (!existing) {
        await supabase.from("profiles").insert({ id: user.id });
      }

      let r = room;
      if (!r) {
        const { data: rooms } = await supabase
          .from("chat_rooms")
          .select("id,title")
          .eq("created_by", user.id)
          .order("created_at", { ascending: true })
          .limit(1);

        if (rooms && rooms.length > 0) {
          r = rooms[0] as ChatRoom;
        } else {
          const { data: created, error: cErr } = await supabase
            .from("chat_rooms")
            .insert({ title: "Private chat", created_by: user.id })
            .select("id,title")
            .single();

          if (cErr) {
            setStatus(cErr.message);
            return;
          }

          r = created as ChatRoom;
        }

        if (!cancelled) setRoom(r);
      }

      if (!r) return;

      const { data: initial } = await supabase
        .from("chat_messages")
        .select("id,content,created_at,sender_id")
        .eq("room_id", r.id)
        .order("created_at", { ascending: true })
        .limit(50);

      if (!cancelled) {
        const initialMessages = (initial ?? []) as ChatMessage[];
        latestMessageAtRef.current = initialMessages.at(-1)?.created_at ?? null;
        setMessages(initialMessages);
      }

      const channel = supabase
        .channel(`room:${r.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "chat_messages",
            filter: `room_id=eq.${r.id}`,
          },
          (payload) => {
            const m = payload.new as ChatMessage;
            applyIncomingMessages([m]);
          },
        )
        .subscribe();

      syncTimer = setInterval(() => {
        void (async () => {
          if (cancelled) return;

          let query = supabase
            .from("chat_messages")
            .select("id,content,created_at,sender_id")
            .eq("room_id", r.id)
            .order("created_at", { ascending: true })
            .limit(50);

          if (latestMessageAtRef.current) {
            query = query.gt("created_at", latestMessageAtRef.current);
          }

          const { data: fresh } = await query;
          if (!cancelled) {
            applyIncomingMessages((fresh ?? []) as ChatMessage[]);
          }
        })();
      }, 2000);

      const onWindowFocus = () => {
        void (async () => {
          let query = supabase
            .from("chat_messages")
            .select("id,content,created_at,sender_id")
            .eq("room_id", r.id)
            .order("created_at", { ascending: true })
            .limit(50);

          if (latestMessageAtRef.current) {
            query = query.gt("created_at", latestMessageAtRef.current);
          }

          const { data: fresh } = await query;
          if (!cancelled) {
            applyIncomingMessages((fresh ?? []) as ChatMessage[]);
          }
        })();
      };

      window.addEventListener("focus", onWindowFocus);

      teardown = () => {
        window.removeEventListener("focus", onWindowFocus);
        if (syncTimer) {
          clearInterval(syncTimer);
        }
        void supabase.removeChannel(channel);
      };
    }

    void run();
    return () => {
      cancelled = true;
      teardown?.();
    };
  }, [applyIncomingMessages, enabled, room]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  async function forwardToTelegram(roomId: string, content: string) {
    const response = await fetch("/api/chat/telegram", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ roomId, content }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string; details?: string } | null;
      throw new Error(payload?.error || "Could not forward message to Telegram.");
    }
  }

  async function send() {
    setStatus(null);
    if (!enabled) {
      setStatus("Authentication is not configured yet.");
      return;
    }
    if (!room) return;
    const message = text.trim();
    if (!message) return;

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setStatus("Sign in on /account to send messages.");
      toast({ title: "Sign in required", description: "Go to /account to continue." });
      return;
    }

    const optimisticId = `temp-${Date.now()}`;
    const optimisticMessage: ChatMessage = {
      id: optimisticId,
      content: message,
      created_at: new Date().toISOString(),
      sender_id: user.id,
      pending: true,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setText("");

    const { data: inserted, error } = await supabase
      .from("chat_messages")
      .insert({
        room_id: room.id,
        sender_id: user.id,
        content: message,
      })
      .select("id,content,created_at,sender_id")
      .single();

    if (error) {
      setMessages((prev) => prev.filter((item) => item.id !== optimisticId));
      setText(message);
      setStatus(error.message);
      toast({ title: "Could not send", description: error.message });
      return;
    }

    if (inserted) {
      setMessages((prev) => prev.map((item) => (item.id === optimisticId ? (inserted as ChatMessage) : item)));
    }

    try {
      await forwardToTelegram(room.id, message);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Could not forward message to Telegram.";
      toast({ title: "Sent in chat only", description: detail });
    }
  }

  async function sendMediaToTelegram(roomId: string, kind: MediaKind, file: File) {
    const formData = new FormData();
    formData.append("roomId", roomId);
    formData.append("kind", kind);
    formData.append("file", file);

    const response = await fetch("/api/chat/telegram/media", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string; details?: string } | null;
      throw new Error(payload?.error || "Could not send media to Telegram.");
    }

    const payload = (await response.json()) as { content: string };
    return payload.content;
  }

  async function sendMediaMessage(kind: MediaKind, file: File | null) {
    if (!file) return;
    setAttachOpen(false);

    if (file.size > MAX_MEDIA_BYTES) {
      toast({ title: "Too large", description: "Media must be less than 20MB." });
      return;
    }

    if (!enabled) {
      setStatus("Authentication is not configured yet.");
      return;
    }

    if (!room) return;

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setStatus("Sign in on /account to send messages.");
      toast({ title: "Sign in required", description: "Go to /account to continue." });
      return;
    }

    let content = "";
    try {
      content = await sendMediaToTelegram(room.id, kind, file);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Could not send media to Telegram.";
      toast({ title: "Media failed", description: detail });
      return;
    }

    const { error } = await supabase.from("chat_messages").insert({
      room_id: room.id,
      sender_id: user.id,
      content,
    });

    if (error) {
      setStatus(error.message);
      toast({ title: "Could not send", description: error.message });
      return;
    }
  }

  async function onPickFile(kind: MediaKind, file: File | null) {
    await sendMediaMessage(kind, file);
  }

  async function toggleVoiceRecording() {
    if (recording) {
      recorderRef.current?.stop();
      setRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recorderStreamRef.current = stream;

      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const voiceFile = new File([blob], `voice-${Date.now()}.webm`, { type: blob.type });

        audioChunksRef.current = [];
        recorderStreamRef.current?.getTracks().forEach((track) => track.stop());
        recorderStreamRef.current = null;
        recorderRef.current = null;

        void sendMediaMessage("voice", voiceFile);
      };

      recorder.start();
      setRecording(true);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Could not start voice recording.";
      toast({ title: "Microphone unavailable", description: detail });
    }
  }

  return (
    <div className="page-chat mx-auto w-full max-w-6xl px-4 py-8">
      <div className="flex items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Chat</h1>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70">
          <span className="h-2 w-2 rounded-full bg-[color:var(--cyber)] shadow-cyber" />
          Realtime
        </div>
      </div>

      {status ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-sm text-white/80">
          {status}
        </div>
      ) : null}

      <div className="mt-6 grid min-h-[70vh] grid-cols-1 overflow-hidden rounded-3xl border border-white/10 bg-black/40 shadow-cyber-soft md:grid-cols-[260px_1fr]">
        <aside className="hidden border-r border-white/10 bg-black/55 md:block">
          <div className="p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-white/50">Channels</div>
            <div className="mt-3 space-y-1">
              {channels.map((c) => {
                const active = c.id === activeChannel;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setActiveChannel(c.id)}
                    className={
                      active
                        ? "flex w-full items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-left text-sm text-white"
                        : "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-white/70 hover:bg-white/5 hover:text-white"
                    }
                  >
                    <span className="text-white/40">#</span>
                    <span className="font-medium">{c.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-white/60">
              <div className="font-semibold text-white/70">Room</div>
              <div className="mt-1">{roomTitle}</div>
            </div>
          </div>
        </aside>

        <section className="flex min-w-0 flex-col">
          <div className="flex items-center justify-between gap-4 border-b border-white/10 bg-black/55 px-4 py-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <span className="text-white/40">#</span>
                <span className="truncate">{activeChannel}</span>
              </div>
              <div className="mt-0.5 text-xs text-white/50">Be respectful. Keep it helpful.</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toast({ title: "Call", description: "Voice calling will be connected here." })}
                className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-black/30 text-xs text-white/80 hover:bg-white/10"
                aria-label="Start call"
              >
                📞
              </button>
              <button
                type="button"
                onClick={() => toast({ title: "Video call", description: "Video calling will be connected here." })}
                className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-black/30 text-xs text-white/80 hover:bg-white/10"
                aria-label="Start video call"
              >
                📹
              </button>
              <a className="text-xs font-medium text-[color:var(--cyber)] hover:underline" href="/account">
                Manage account
              </a>
            </div>
          </div>

          <div ref={scrollerRef} className="flex-1 overflow-y-auto bg-black/35 px-4 py-4">
            {messages.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
                No messages yet.
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((m) => {
                  const parsed = parseMessage(m.content);
                  const isTelegramReply = parsed.isTelegramReply;
                  return (
                    <div key={m.id} className={isTelegramReply ? "group flex justify-end" : "group flex gap-2"}>
                      {isTelegramReply ? null : (
                        <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-[10px] font-semibold text-white/80">
                          {initialsFrom(m.sender_id)}
                        </div>
                      )}
                      <div className="min-w-0 max-w-[82%] sm:max-w-[70%]">
                        <div className={isTelegramReply ? "flex items-baseline justify-end gap-2" : "flex items-baseline gap-2"}>
                          <div className="text-sm font-semibold text-white">
                            {shortId(m.sender_id)}
                          </div>
                          <div className="text-xs text-white/40">
                            {new Date(m.created_at).toLocaleTimeString()}
                          </div>
                        </div>
                        {parsed.media ? (
                          <div className="mt-1 space-y-2">
                            {parsed.media.kind === "photo" ? (
                              <img
                                src={`/api/telegram/file?fileId=${encodeURIComponent(parsed.media.fileId)}`}
                                alt="Shared media"
                                className="max-h-64 max-w-full rounded-xl border border-white/10 object-cover"
                              />
                            ) : null}
                            {parsed.media.kind === "video" ? (
                              <video
                                controls
                                className="max-h-72 max-w-full rounded-xl border border-white/10"
                                src={`/api/telegram/file?fileId=${encodeURIComponent(parsed.media.fileId)}`}
                              />
                            ) : null}
                            {parsed.media.kind === "voice" ? (
                              <audio
                                controls
                                className="max-w-full"
                                src={`/api/telegram/file?fileId=${encodeURIComponent(parsed.media.fileId)}`}
                              />
                            ) : null}
                            {parsed.text ? (
                              <div
                                className={
                                  isTelegramReply
                                    ? "bubble-telegram inline-block max-w-full whitespace-pre-wrap break-words rounded-xl border border-[color:var(--cyber)]/30 bg-[color:var(--cyber)]/10 px-3 py-2 text-xs sm:text-sm text-white/95"
                                    : "bubble-user inline-block max-w-full whitespace-pre-wrap break-words rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs sm:text-sm text-white/90"
                                }
                              >
                                {parsed.text}
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          <div
                            className={
                              isTelegramReply
                                ? "bubble-telegram mt-1 inline-block max-w-full whitespace-pre-wrap break-words rounded-xl border border-[color:var(--cyber)]/30 bg-[color:var(--cyber)]/10 px-3 py-2 text-xs sm:text-sm text-white/95"
                                : "bubble-user mt-1 inline-block max-w-full whitespace-pre-wrap break-words rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs sm:text-sm text-white/90"
                            }
                          >
                            {parsed.text}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-t border-white/10 bg-black/55 p-4">
            <div className="relative flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
              <button
                type="button"
                className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-black/30 text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-white active:scale-[0.98]"
                onClick={() => setAttachOpen((v) => !v)}
                aria-label="Add attachment"
              >
                +
              </button>

              {attachOpen ? (
                <div className="absolute bottom-[52px] left-0 z-20 w-64 overflow-hidden rounded-2xl border border-white/10 bg-black/80 shadow-cyber-soft">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-white/80 hover:bg-white/5"
                    onClick={() => photoInputRef.current?.click()}
                  >
                    <span>Photo</span>
                    <span className="text-xs text-white/40">PNG/JPG</span>
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-white/80 hover:bg-white/5"
                    onClick={() => videoInputRef.current?.click()}
                  >
                    <span>Video</span>
                    <span className="text-xs text-white/40">MP4/MOV</span>
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-white/80 hover:bg-white/5"
                    onClick={() => voiceInputRef.current?.click()}
                  >
                    <span>Voice message</span>
                    <span className="text-xs text-white/40">Audio file</span>
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-white/80 hover:bg-white/5"
                    onClick={() => void toggleVoiceRecording()}
                  >
                    <span>{recording ? "Stop recording" : "Record voice"}</span>
                    <span className="text-xs text-white/40">Mic</span>
                  </button>
                </div>
              ) : null}

              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => void onPickFile("photo", e.target.files?.[0] ?? null)}
              />
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => void onPickFile("video", e.target.files?.[0] ?? null)}
              />
              <input
                ref={voiceInputRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => void onPickFile("voice", e.target.files?.[0] ?? null)}
              />

              <button
                type="button"
                onClick={() => void toggleVoiceRecording()}
                className={
                  recording
                    ? "grid h-9 w-9 place-items-center rounded-xl border border-red-400/60 bg-red-500/20 text-sm font-semibold text-red-200"
                    : "grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-black/30 text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-white"
                }
                aria-label="Voice message"
              >
                🎤
              </button>

              <input
                className="flex-1 bg-transparent px-2 py-2 text-sm text-white outline-none placeholder:text-white/40"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={`Message #${activeChannel}`}
                disabled={false}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void send();
                }}
              />
              <Button variant="secondary" size="sm" className="text-white" onClick={() => void send()}>
                Send
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
