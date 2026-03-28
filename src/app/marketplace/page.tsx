"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { AggregatedMarketplaceItem, Listing } from "@/lib/models";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { demoStore } from "@/lib/demo/store";
import { ButtonLink } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Scroll3D } from "@/components/ui/Scroll3D";

type SortMode = "newest" | "price_asc" | "price_desc";

type FeaturedItem = {
  id: string;
  title: string;
  description: string;
  category: string;
  price_cents: number;
  currency: string;
  created_at: string;
  source: string;
  image_url: string | null;
  external: boolean;
  href: string;
};

function categoryLabel(value: string): string {
  return value.replaceAll("_", " ");
}

const FX_TO_KES: Record<string, number> = {
  KES: 1,
  USD: 135,
  EUR: 148,
  GBP: 172,
};

function toKesCents(priceCents: number, currency: string): number {
  const rate = FX_TO_KES[currency.toUpperCase()] ?? 1;
  return Math.round(priceCents * rate);
}

function formatKes(priceCents: number, currency: string): string {
  const kes = Math.round(toKesCents(priceCents, currency) / 100);
  return `KSh ${new Intl.NumberFormat("en-KE").format(kes)}`;
}

function cleanExternalDescription(raw: string): string {
  const trimmed = raw.replace(/\s+/g, " ").trim();
  const current = trimmed.match(/current price(?:\s+is)?\s*[:]?\s*(ksh|kes)?\s*([\d,]+(?:\.\d+)?)/i);
  if (current?.[2]) {
    const normalized = Number.parseFloat(current[2].replace(/,/g, ""));
    if (Number.isFinite(normalized)) {
      return `Current price: KSh ${new Intl.NumberFormat("en-KE").format(Math.round(normalized))}`;
    }
  }

  const allKesValues = [...trimmed.matchAll(/(?:ksh|kes)\s*([\d,]+(?:\.\d+)?)/gi)];
  const finalKes = allKesValues.at(-1)?.[1];
  if (finalKes) {
    const normalized = Number.parseFloat(finalKes.replace(/,/g, ""));
    if (Number.isFinite(normalized)) {
      return `Current price: KSh ${new Intl.NumberFormat("en-KE").format(Math.round(normalized))}`;
    }
  }

  return trimmed
    .replace(/original price was\s*[:]?\s*(ksh|kes)?\s*[\d,]+(?:\.\d+)?\.?/gi, "")
    .replace(/current price is\s*[:]?\s*(ksh|kes)?\s*[\d,]+(?:\.\d+)?\.?/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanExternalTitle(raw: string): string {
  return raw
    .replace(/original price was\s*[:]?(?:\s*(ksh|kes)?\s*[\d,]+(?:\.\d+)?)?\.?/gi, "")
    .replace(/current price(?:\s+is)?\s*[:]?(?:\s*(ksh|kes)?\s*[\d,]+(?:\.\d+)?)?\.?/gi, "")
    .replace(/(?:ksh|kes)\s*[\d,]+(?:\.\d+)?/gi, "")
    .replace(/\s+/g, " ")
    .replace(/^[\s:;,.\-]+|[\s:;,.\-]+$/g, "")
    .trim();
}

function hasDescription(value: string): boolean {
  return value.replace(/\s+/g, " ").trim().length >= 10;
}

export default function MarketplacePage() {
  const enabled = useMemo(() => hasSupabaseEnv(), []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [externalListings, setExternalListings] = useState<AggregatedMarketplaceItem[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [sort, setSort] = useState<SortMode>("newest");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const externalRes = await fetch("/api/marketplace", { cache: "no-store" });
        if (externalRes.ok) {
          const payload = (await externalRes.json()) as { items?: AggregatedMarketplaceItem[] };
          if (!cancelled && payload.items && payload.items.length > 0) {
            setExternalListings(payload.items);
          }
        }

        if (!enabled) {
          if (!cancelled) setListings(demoStore.getListings());
          return;
        }

        const supabase = createClient();
        const { data, error: qErr } = await supabase
          .from("listings")
          .select("id,title,description,category,price_cents,currency,seller_id,created_at")
          .order("created_at", { ascending: false })
          .limit(50);

        if (qErr) throw qErr;
        if (!cancelled) setListings((data ?? []) as Listing[]);
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

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const l of listings) set.add(l.category);
    for (const l of externalListings) set.add(l.category);
    const sorted = Array.from(set).sort((a, b) => a.localeCompare(b));
    return ["all", ...sorted];
  }, [listings, externalListings]);

  const normalizedQuery = useMemo(() => query.trim().toLowerCase(), [query]);

  const visibleLocal = useMemo(() => {
    return listings.filter((l) => {
      if (!hasDescription(l.description)) return false;
      const categoryOk = category === "all" ? true : l.category === category;
      if (!categoryOk) return false;
      if (!normalizedQuery) return true;
      const hay = `${l.title} ${l.description} ${l.category}`.toLowerCase();
      return hay.includes(normalizedQuery);
    });
  }, [category, listings, normalizedQuery]);

  const visibleExternal = useMemo(() => {
    return externalListings.filter((l) => {
      if (!hasDescription(l.description)) return false;
      const categoryOk = category === "all" ? true : l.category === category;
      if (!categoryOk) return false;
      if (!normalizedQuery) return true;
      const hay = `${l.title} ${l.description} ${l.category} ${l.source} ${l.currency}`.toLowerCase();
      return hay.includes(normalizedQuery);
    });
  }, [category, externalListings, normalizedQuery]);

  const compareItems = useMemo(() => {
    return (a: { price_cents: number; created_at: string }, b: { price_cents: number; created_at: string }) => {
      if (sort === "price_asc") return a.price_cents - b.price_cents;
      if (sort === "price_desc") return b.price_cents - a.price_cents;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    };
  }, [sort]);

  const sortedLocal = useMemo(() => {
    return [...visibleLocal].sort(compareItems);
  }, [compareItems, visibleLocal]);

  const sortedExternal = useMemo(() => {
    return [...visibleExternal].sort(compareItems);
  }, [compareItems, visibleExternal]);

  const giftAndCoupons = useMemo(() => {
    return sortedExternal.filter(
      (item) => item.category === "gift_card" || item.category === "coupon",
    );
  }, [sortedExternal]);

  const externalMain = useMemo(() => {
    return sortedExternal.filter(
      (item) => item.category !== "gift_card" && item.category !== "coupon",
    );
  }, [sortedExternal]);

  const featured = useMemo(() => {
    const fromExternal: FeaturedItem[] = externalMain.map((item) => ({
      ...item,
      external: true,
      href: item.source_url,
    }));
    const fromLocal: FeaturedItem[] = sortedLocal.map((item) => ({
      ...item,
      source: "CydeHub",
      image_url: null,
      external: false,
      href: `/marketplace/${item.id}`,
    }));

    return [...fromExternal, ...fromLocal].sort(compareItems).slice(0, 3);
  }, [compareItems, externalMain, sortedLocal]);

  const totalVisible = sortedLocal.length + sortedExternal.length;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="animated-sheen rounded-3xl border border-white/10 bg-black/40 p-6 shadow-cyber-soft">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/80">
              <span className="h-2 w-2 rounded-full bg-[color:var(--cyber)] shadow-cyber" />
              Find what you need. Fast.
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">
              Marketplace
            </h1>
            <p className="mt-2 text-white/70">
              Live-sourced offers for games, consoles, accounts, gift cards,
              coupons, and more.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <ButtonLink
              href="/sell/new"
              variant="primary"
              size="md"
              className="animated-sheen text-white"
            >
              Create listing
            </ButtonLink>
            <ButtonLink href="/account" variant="secondary" size="md">
              Sign in
            </ButtonLink>
          </div>
        </div>
      </div>

      <div className="sticky top-[72px] z-10 mt-6 rounded-3xl border border-white/10 bg-black/40 p-4 shadow-cyber-soft">
        <div className="grid gap-3 md:grid-cols-[1fr_220px_220px]">
          <label className="block">
            <div className="text-xs font-medium text-white/60">Search</div>
            <input
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:ring-2 focus:ring-[color:var(--cyber)]/30"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, source, category, game, console, account, gift card, coupon..."
            />
          </label>

          <label className="block">
            <div className="text-xs font-medium text-white/60">Category</div>
            <select
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-[color:var(--cyber)]/30"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c} value={c} className="bg-black text-white">
                  {c === "all" ? "All" : categoryLabel(c)}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <div className="text-xs font-medium text-white/60">Sort by</div>
            <select
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-[color:var(--cyber)]/30"
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
            >
              <option value="newest" className="bg-black text-white">Newest</option>
              <option value="price_asc" className="bg-black text-white">Price: Low to high</option>
              <option value="price_desc" className="bg-black text-white">Price: High to low</option>
            </select>
          </label>
        </div>
      </div>

      {error ? (
        <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-50 px-5 py-4 text-sm text-red-900 dark:border-red-400/20 dark:bg-red-950/30 dark:text-red-100">
          {error}
        </div>
      ) : null}

      {!loading && featured.length > 0 ? (
        <div className="mt-8">
          <div className="flex items-end justify-between gap-6">
            <div>
              <div className="text-sm font-semibold text-white">Featured</div>
              <div className="mt-1 text-sm text-white/60">
                Trending offers from CydeHub + live external sources.
              </div>
            </div>
            <div className="text-xs text-white/50">Showing {totalVisible} results</div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {featured.map((item) => (
              <Scroll3D key={item.id}>
                {item.external ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="group animated-sheen block rounded-3xl border border-white/10 bg-black/35 p-7 shadow-cyber-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-cyber"
                  >
                    <div className="flex h-full flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <div className="pill-3d-cyber rounded-full px-3 py-1 text-xs font-semibold text-[color:var(--cyber)]">
                          {categoryLabel(item.category)}
                        </div>
                        <div className="pill-3d shrink-0 rounded-full px-3 py-1 text-xs font-medium text-white">
                          {formatKes(item.price_cents, item.currency)}
                        </div>
                      </div>

                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="mt-4 h-36 w-full rounded-2xl border border-white/10 object-cover"
                          loading="lazy"
                        />
                      ) : null}

                      <div className="mt-4 text-lg font-semibold leading-snug tracking-tight text-white">
                        {item.external ? cleanExternalTitle(item.title) || item.title : item.title}
                      </div>
                      <div className="mt-3 line-clamp-3 text-justify text-sm leading-relaxed text-white/70">
                        {item.external ? cleanExternalDescription(item.description) : item.description}
                      </div>

                      <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[color:var(--cyber)]">
                        Open source listing
                        <span className="transition-transform duration-150 group-hover:translate-x-0.5">→</span>
                      </div>
                    </div>
                  </a>
                ) : (
                  <Link
                    href={item.href}
                    className="group animated-sheen block rounded-3xl border border-white/10 bg-black/35 p-7 shadow-cyber-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-cyber"
                  >
                    <div className="flex h-full flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <div className="pill-3d-cyber rounded-full px-3 py-1 text-xs font-semibold text-[color:var(--cyber)]">
                          {categoryLabel(item.category)}
                        </div>
                        <div className="pill-3d shrink-0 rounded-full px-3 py-1 text-xs font-medium text-white">
                          {formatKes(item.price_cents, item.currency)}
                        </div>
                      </div>

                      <div className="mt-4 text-lg font-semibold leading-snug tracking-tight text-white">
                        {item.title}
                      </div>
                      <div className="mt-3 line-clamp-3 text-sm leading-relaxed text-white/70">
                        {item.description}
                      </div>

                      <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[color:var(--cyber)]">
                        View listing
                        <span className="transition-transform duration-150 group-hover:translate-x-0.5">→</span>
                      </div>
                    </div>
                  </Link>
                )}
              </Scroll3D>
            ))}
          </div>
        </div>
      ) : null}

      {!loading && giftAndCoupons.length > 0 ? (
        <div className="mt-8">
          <div className="flex items-end justify-between gap-6">
            <div>
              <div className="text-sm font-semibold text-white">Gift Cards & Coupons</div>
              <div className="mt-1 text-sm text-white/60">
                Buy top-up cards and discount coupons sourced from marketplace partners.
              </div>
            </div>
            <div className="text-xs text-white/50">{giftAndCoupons.length} items</div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {giftAndCoupons.map((item) => (
              <a
                key={item.id}
                href={item.source_url}
                target="_blank"
                rel="noreferrer"
                className="group animated-sheen rounded-3xl border border-white/10 bg-black/40 p-5 shadow-cyber-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-cyber"
              >
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="h-40 w-full rounded-2xl border border-white/10 object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-40 w-full items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sm text-white/55">
                    Marketplace image
                  </div>
                )}

                <div className="mt-4 flex items-start justify-between gap-4">
                  <div>
                    <div className="mt-2 text-base font-semibold tracking-tight text-white">
                      {cleanExternalTitle(item.title) || item.title}
                    </div>
                  </div>
                  <div className="pill-3d shrink-0 rounded-full px-3 py-1 text-sm font-medium text-white">
                    {formatKes(item.price_cents, item.currency)}
                  </div>
                </div>

                <div className="mt-2 line-clamp-2 text-justify text-sm text-white/70">{cleanExternalDescription(item.description)}</div>
                <div className="mt-3 text-sm font-medium text-[color:var(--cyber)] underline-offset-4 group-hover:underline">
                  Buy now
                </div>
              </a>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <>
            <div className="space-y-3 rounded-3xl border border-white/10 bg-black/30 p-6">
              <Skeleton className="h-44 w-full" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
            </div>
            <div className="space-y-3 rounded-3xl border border-white/10 bg-black/30 p-6">
              <Skeleton className="h-44 w-full" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-full" />
            </div>
            <div className="hidden space-y-3 rounded-3xl border border-white/10 bg-black/30 p-6 xl:block">
              <Skeleton className="h-44 w-full" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-3/5" />
              <Skeleton className="h-4 w-full" />
            </div>
          </>
        ) : null}

        {!loading && totalVisible === 0 ? (
          <div className="text-sm text-white/60">
            No results.
          </div>
        ) : null}

        {externalMain.map((item) => (
          <a
            key={item.id}
            href={item.source_url}
            target="_blank"
            rel="noreferrer"
            className="group animated-sheen rounded-3xl border border-white/10 bg-black/40 p-6 shadow-cyber-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-cyber"
          >
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.title}
                className="h-40 w-full rounded-2xl border border-white/10 object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex h-40 w-full items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sm text-white/55">
                Marketplace image
              </div>
            )}

            <div className="mt-4 flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex">
                  <div className="pill-3d-cyber rounded-full px-3 py-1 text-xs font-semibold text-[color:var(--cyber)]">
                    {categoryLabel(item.category)}
                  </div>
                </div>
                <div className="mt-2 text-lg font-semibold tracking-tight text-white">
                  {cleanExternalTitle(item.title) || item.title}
                </div>
              </div>
              <div className="pill-3d shrink-0 rounded-full px-3 py-1 text-sm font-medium text-white">
                {formatKes(item.price_cents, item.currency)}
              </div>
            </div>
            <div className="mt-3 line-clamp-2 text-justify text-sm text-white/70">{cleanExternalDescription(item.description)}</div>
            <div className="mt-4 text-sm font-medium text-[color:var(--cyber)] underline-offset-4 group-hover:underline">
              Open source listing
            </div>
          </a>
        ))}

        {sortedLocal.map((l) => (
          <Link
            key={l.id}
            href={`/marketplace/${l.id}`}
            className="group animated-sheen rounded-3xl border border-white/10 bg-black/40 p-6 shadow-cyber-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-cyber"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex">
                  <div className="pill-3d-cyber rounded-full px-3 py-1 text-xs font-semibold text-[color:var(--cyber)]">
                    {categoryLabel(l.category)}
                  </div>
                </div>
                <div className="mt-2 text-lg font-semibold tracking-tight text-white">
                  {l.title}
                </div>
              </div>
              <div className="pill-3d shrink-0 rounded-full px-3 py-1 text-sm font-medium text-white">
                {formatKes(l.price_cents, l.currency)}
              </div>
            </div>
            <div className="mt-3 line-clamp-2 text-justify text-sm text-white/70">
              {l.description}
            </div>
            <div className="mt-4 text-sm font-medium text-[color:var(--cyber)] underline-offset-4 group-hover:underline">
              View
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
