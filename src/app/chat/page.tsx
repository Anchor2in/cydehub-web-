"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { demoStore } from "@/lib/demo/store";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/toast";

type ChatMessage = {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
};

type ChatRoom = {
  id: string;
  title: string | null;
};

export default function ChatPage() {
  const enabled = useMemo(() => hasSupabaseEnv(), []);
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const { toast } = useToast();
  const [activeChannel, setActiveChannel] = useState("general");
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [attachOpen, setAttachOpen] = useState(false);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const docInputRef = useRef<HTMLInputElement | null>(null);

  const channels = useMemo(
    () => [
      { id: "general", label: "general" },
      { id: "marketplace", label: "marketplace" },
      { id: "tournaments", label: "tournaments" },
      { id: "support", label: "support" },
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

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!enabled) {
        setMessages(demoStore.getChatMessages());
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
          .order("created_at", { ascending: true })
          .limit(1);

        if (rooms && rooms.length > 0) {
          r = rooms[0] as ChatRoom;
        } else {
          const { data: created, error: cErr } = await supabase
            .from("chat_rooms")
            .insert({ title: "General", created_by: user.id })
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

      if (!cancelled) setMessages((initial ?? []) as ChatMessage[]);

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
            setMessages((prev) => [...prev, m]);
          },
        )
        .subscribe();

      return () => {
        void supabase.removeChannel(channel);
      };
    }

    const cleanupPromise = run();
    return () => {
      cancelled = true;
      void cleanupPromise;
    };
  }, [enabled, room]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  async function send() {
    setStatus(null);
    if (!enabled) {
      if (!text.trim()) return;
      const msg = demoStore.addChatMessage(text.trim());
      setMessages((prev) => [...prev, msg]);
      setText("");
      toast({ title: "Message sent", description: "Saved locally (demo mode)." });
      return;
    }
    if (!room) return;
    if (!text.trim()) return;

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setStatus("Sign in on /account to send messages.");
      toast({ title: "Sign in required", description: "Go to /account to continue." });
      return;
    }

    const { error } = await supabase.from("chat_messages").insert({
      room_id: room.id,
      sender_id: user.id,
      content: text.trim(),
    });

    if (error) {
      setStatus(error.message);
      toast({ title: "Could not send", description: error.message });
      return;
    }

    setText("");
  }

  async function sendSystemMessage(content: string) {
    if (!content.trim()) return;
    setText("");
    setAttachOpen(false);

    if (!enabled) {
      const msg = demoStore.addChatMessage(content.trim());
      setMessages((prev) => [...prev, msg]);
      toast({ title: "Added", description: "Saved locally (demo mode)." });
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

    const { error } = await supabase.from("chat_messages").insert({
      room_id: room.id,
      sender_id: user.id,
      content: content.trim(),
    });

    if (error) {
      setStatus(error.message);
      toast({ title: "Could not send", description: error.message });
      return;
    }

    toast({ title: "Added" });
  }

  function attachLabel(kind: "photo" | "video" | "doc", file: File) {
    const name = file.name || "attachment";
    if (kind === "photo") return `🖼️ Photo: ${name}`;
    if (kind === "video") return `🎬 Video: ${name}`;
    return `📎 Document: ${name}`;
  }

  async function onPickFile(kind: "photo" | "video" | "doc", file: File | null) {
    if (!file) return;
    const content = attachLabel(kind, file);
    if (enabled) {
      toast({
        title: "Attachment (placeholder)",
        description: "Uploading to storage isn't wired yet. Sending a reference message instead.",
      });
    }
    await sendSystemMessage(content);
  }

  async function addLink() {
    const url = window.prompt("Paste a link URL");
    if (!url) return;
    const content = `🔗 ${url}`;
    await sendSystemMessage(content);
  }

  async function addLocation() {
    if (!navigator.geolocation) {
      toast({ title: "Not supported", description: "Geolocation is not available in this browser." });
      return;
    }

    toast({ title: "Getting location…" });

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const maps = `https://maps.google.com/?q=${latitude},${longitude}`;
        await sendSystemMessage(`📍 Location: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}\n${maps}`);
      },
      (err) => {
        toast({ title: "Location error", description: err.message });
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="flex items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Chat</h1>
          <p className="mt-1 text-sm text-white/60">
            Discord-style layout with realtime messaging.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70">
          <span className="h-2 w-2 rounded-full bg-[color:var(--cyber)] shadow-cyber" />
          {enabled ? "Realtime" : "Demo"}
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
            <a className="text-xs font-medium text-[color:var(--cyber)] hover:underline" href="/account">
              {enabled ? "Manage account" : "Sign in"}
            </a>
          </div>

          <div ref={scrollerRef} className="flex-1 overflow-y-auto bg-black/35 px-4 py-4">
            {messages.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
                No messages yet.
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((m) => (
                  <div key={m.id} className="group flex gap-3">
                    <div className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/5 text-xs font-semibold text-white/80">
                      {initialsFrom(m.sender_id)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <div className="text-sm font-semibold text-white">
                          {shortId(m.sender_id)}
                        </div>
                        <div className="text-xs text-white/40">
                          {new Date(m.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                      <div className="mt-1 whitespace-pre-wrap rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/90">
                        {m.content}
                      </div>
                    </div>
                  </div>
                ))}
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
                    onClick={() => void addLink()}
                  >
                    <span>Link</span>
                    <span className="text-xs text-white/40">URL</span>
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-white/80 hover:bg-white/5"
                    onClick={() => docInputRef.current?.click()}
                  >
                    <span>Document</span>
                    <span className="text-xs text-white/40">PDF/DOC</span>
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-white/80 hover:bg-white/5"
                    onClick={() => void addLocation()}
                  >
                    <span>Location</span>
                    <span className="text-xs text-white/40">GPS</span>
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
                ref={docInputRef}
                type="file"
                className="hidden"
                onChange={(e) => void onPickFile("doc", e.target.files?.[0] ?? null)}
              />

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
            <div className="mt-2 text-xs text-white/40">
              Demo mode stores messages locally. Realtime mode requires signing in.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
