"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import type { AggregatedTournamentPost, Tournament } from "@/lib/models";
import { demoStore } from "@/lib/demo/store";
import { Skeleton } from "@/components/ui/Skeleton";

export default function TournamentsPage() {
  const enabled = useMemo(() => hasSupabaseEnv(), []);
  const [items, setItems] = useState<Tournament[]>([]);
  const [externalItems, setExternalItems] = useState<AggregatedTournamentPost[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const categories = useMemo(() => {
    const games = new Set<string>();
    for (const item of externalItems) games.add(item.game);
    for (const item of items) games.add(item.game);
    return ["All", ...Array.from(games).sort((a, b) => a.localeCompare(b))];
  }, [externalItems, items]);

  const filteredExternalItems = useMemo(() => {
    if (selectedCategory === "All") return externalItems;
    return externalItems.filter((item) => item.game === selectedCategory);
  }, [externalItems, selectedCategory]);

  const filteredLocalItems = useMemo(() => {
    if (selectedCategory === "All") return items;
    return items.filter((item) => item.game === selectedCategory);
  }, [items, selectedCategory]);

  const normalizedQuery = useMemo(() => searchQuery.trim().toLowerCase(), [searchQuery]);

  const visibleExternalItems = useMemo(() => {
    if (!normalizedQuery) return filteredExternalItems;
    return filteredExternalItems.filter((item) => {
      const text = `${item.title} ${item.game} ${item.summary} ${item.story} ${item.source}`.toLowerCase();
      return text.includes(normalizedQuery);
    });
  }, [filteredExternalItems, normalizedQuery]);

  const visibleLocalItems = useMemo(() => {
    if (!normalizedQuery) return filteredLocalItems;
    return filteredLocalItems.filter((item) => {
      const text = `${item.title} ${item.game}`.toLowerCase();
      return text.includes(normalizedQuery);
    });
  }, [filteredLocalItems, normalizedQuery]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const externalRes = await fetch("/api/tournaments", { cache: "no-store" });
        if (externalRes.ok) {
          const payload = (await externalRes.json()) as {
            items?: AggregatedTournamentPost[];
          };

          if (!cancelled && payload.items && payload.items.length > 0) {
            setExternalItems(payload.items);
            setLoading(false);
            return;
          }
        }

        if (!enabled) {
          if (!cancelled) setItems(demoStore.getTournaments());
          return;
        }

        const supabase = createClient();
        const { data, error: qErr } = await supabase
          .from("tournaments")
          .select("id,title,game,starts_at,created_by,created_at")
          .order("starts_at", { ascending: true })
          .limit(50);

        if (qErr) throw qErr;
        if (!cancelled) setItems((data ?? []) as Tournament[]);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        if (!cancelled) setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="flex items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Tournaments
          </h1>
          <p className="mt-2 text-white/70">
            Create, join, and track upcoming events.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="/chat"
            className="text-sm font-medium text-[color:var(--cyber)] hover:underline"
          >
            Open chat
          </a>
          <a
            href="/blog"
            className="text-sm font-medium text-[color:var(--cyber)] hover:underline"
          >
            Read updates
          </a>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {categories.map((category) => {
          const active = category === selectedCategory;
          return (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={`rounded-full border px-3 py-1 text-xs transition ${
                active
                  ? "border-[color:var(--cyber)] bg-[color:var(--cyber)]/15 text-white"
                  : "border-white/15 bg-white/5 text-white/70 hover:border-white/30 hover:text-white"
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search tournaments by title, game, source, or details..."
          className="w-full rounded-2xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/45 outline-none transition focus:border-[color:var(--cyber)] focus:ring-2 focus:ring-[color:var(--cyber)]/30"
        />
      </div>

      {error ? (
        <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-50 px-5 py-4 text-sm text-red-900 dark:border-red-400/20 dark:bg-red-950/30 dark:text-red-100">
          {error}
        </div>
      ) : null}

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <>
            <div className="space-y-3 rounded-3xl border border-white/10 bg-black/30 p-6">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-5/6" />
            </div>
            <div className="space-y-3 rounded-3xl border border-white/10 bg-black/30 p-6">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-4/6" />
            </div>
            <div className="hidden space-y-3 rounded-3xl border border-white/10 bg-black/30 p-6 xl:block">
              <Skeleton className="h-6 w-3/5" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-4/6" />
            </div>
          </>
        ) : null}

        {!loading && visibleLocalItems.length === 0 && visibleExternalItems.length === 0 ? (
          <div className="text-sm text-white/60">
            No tournaments yet.
          </div>
        ) : null}

        {visibleExternalItems.map((t) => (
          <Link
            key={t.id}
            href={`/tournaments/${t.slug}`}
            className="animated-sheen rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl p-6 shadow-cyber-soft transition-transform duration-200 hover:-translate-y-0.5"
          >
            <div className="inline-flex rounded-full border border-white/15 bg-white/5 px-2 py-1 text-xs text-white/70">
              {t.source}
            </div>
            <div className="mt-3 text-lg font-semibold tracking-tight text-white">{t.title}</div>
            <div className="mt-1 text-sm text-white/60">{t.game}</div>
            <div className="mt-3 text-sm text-white/70">{t.summary || t.story.slice(0, 180)}</div>
            <div className="mt-4 text-sm text-white">
              <span className="font-medium">Starts:</span> {new Date(t.starts_at).toLocaleString()}
            </div>
          </Link>
        ))}

        {visibleLocalItems.map((t) => (
          <div
            key={t.id}
            className="animated-sheen rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl p-6 shadow-cyber-soft"
          >
            <div className="text-lg font-semibold tracking-tight text-white">{t.title}</div>
            <div className="mt-1 text-sm text-white/60">
              {t.game}
            </div>
            <div className="mt-4 text-sm text-white">
              <span className="font-medium">Starts:</span>{" "}
              {new Date(t.starts_at).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
