"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import type { AggregatedBlogPost, BlogPost } from "@/lib/models";
import { Skeleton } from "@/components/ui/Skeleton";

export default function BlogPage() {
  const enabled = useMemo(() => hasSupabaseEnv(), []);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [externalPosts, setExternalPosts] = useState<AggregatedBlogPost[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const categories = useMemo(() => {
    const sourceSet = new Set(externalPosts.map((p) => p.source));
    const hasLocalPosts = posts.length > 0;
    const sourceCategories = [...sourceSet].sort((a, b) => a.localeCompare(b));
    return ["All", ...sourceCategories, ...(hasLocalPosts ? ["CydeHub"] : [])];
  }, [externalPosts, posts.length]);

  const filteredExternalPosts = useMemo(() => {
    if (selectedCategory === "All") return externalPosts;
    return externalPosts.filter((p) => p.source === selectedCategory);
  }, [externalPosts, selectedCategory]);

  const filteredLocalPosts = useMemo(() => {
    if (selectedCategory === "All" || selectedCategory === "CydeHub") return posts;
    return [];
  }, [posts, selectedCategory]);

  const normalizedQuery = useMemo(() => searchQuery.trim().toLowerCase(), [searchQuery]);

  const visibleExternalPosts = useMemo(() => {
    if (!normalizedQuery) return filteredExternalPosts;
    return filteredExternalPosts.filter((p) => {
      const text = `${p.title} ${p.excerpt} ${p.story} ${p.source}`.toLowerCase();
      return text.includes(normalizedQuery);
    });
  }, [filteredExternalPosts, normalizedQuery]);

  const visibleLocalPosts = useMemo(() => {
    if (!normalizedQuery) return filteredLocalPosts;
    return filteredLocalPosts.filter((p) => {
      const text = `${p.title} ${p.content}`.toLowerCase();
      return text.includes(normalizedQuery);
    });
  }, [filteredLocalPosts, normalizedQuery]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const externalRes = await fetch("/api/blog", { cache: "no-store" });
        if (externalRes.ok) {
          const payload = (await externalRes.json()) as { posts?: AggregatedBlogPost[] };
          if (!cancelled && payload.posts && payload.posts.length > 0) {
            setExternalPosts(payload.posts);
            setLoading(false);
            return;
          }
        }

        if (!enabled) {
          if (!cancelled) setError("Blog storage is not configured yet.");
          return;
        }

        const supabase = createClient();
        const { data, error: qErr } = await supabase
          .from("blog_posts")
          .select("id,title,content,author_id,created_at")
          .order("created_at", { ascending: false })
          .limit(20);

        if (qErr) throw qErr;
        if (!cancelled) setPosts((data ?? []) as BlogPost[]);
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
    <div className="page-blog mx-auto w-full max-w-6xl px-4 py-10">
      <div className="flex items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Blog & updates
          </h1>
          <p className="mt-2 text-white/70">
            News, views, and real-life lessons in gaming commerce.
          </p>
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
          placeholder="Search blogs by title, source, or story..."
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
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>
            <div className="hidden space-y-3 rounded-3xl border border-white/10 bg-black/30 p-6 md:block">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>
            <div className="hidden space-y-3 rounded-3xl border border-white/10 bg-black/30 p-6 xl:block">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>
          </>
        ) : null}

        {!loading && visibleLocalPosts.length === 0 && visibleExternalPosts.length === 0 ? (
          <div className="text-sm text-white/60">
            No posts yet.
          </div>
        ) : null}

        {visibleExternalPosts.map((p) => (
          <Link
            key={p.id}
            href={`/blog/${p.slug}`}
            className="animated-sheen rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl p-6 shadow-cyber-soft transition-transform duration-200 hover:-translate-y-0.5"
          >
            <div className="inline-flex rounded-full border border-white/15 bg-white/5 px-2 py-1 text-xs text-white/70">
              {p.source}
            </div>
            <h2 className="mt-3 text-xl font-semibold tracking-tight text-white">{p.title}</h2>
            <div className="mt-3 text-sm text-white/70">{p.excerpt || p.story.slice(0, 220)}</div>
            <div className="mt-4 text-xs text-white/50">
              {new Date(p.created_at).toLocaleString()} • Read full story
            </div>
          </Link>
        ))}

        {visibleLocalPosts.map((p) => (
          <article
            key={p.id}
            className="animated-sheen rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl p-6 shadow-cyber-soft"
          >
            <h2 className="text-xl font-semibold tracking-tight text-white">{p.title}</h2>
            <div className="mt-3 whitespace-pre-wrap text-sm text-white/70">
              {p.content}
            </div>
            <div className="mt-4 text-xs text-white/50">
              {new Date(p.created_at).toLocaleString()}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
