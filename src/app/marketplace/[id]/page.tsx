"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import type { Listing } from "@/lib/models";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { demoStore } from "@/lib/demo/store";
import { Button } from "@/components/ui/Button";

export default function ListingPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const enabled = useMemo(() => hasSupabaseEnv(), []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listing, setListing] = useState<Listing | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!enabled) {
        setListing(demoStore.getListing(id));
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const { data, error: qErr } = await supabase
          .from("listings")
          .select("id,title,description,category,price_cents,currency,seller_id,created_at")
          .eq("id", id)
          .maybeSingle();

        if (qErr) throw qErr;
        if (!cancelled) setListing((data as Listing) ?? null);
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
  }, [enabled, id]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      {loading ? (
        <div className="text-sm text-white/60">Loading…</div>
      ) : error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-50 px-5 py-4 text-sm text-red-900 dark:border-red-400/20 dark:bg-red-950/30 dark:text-red-100">
          {error}
        </div>
      ) : !listing ? (
        <div className="text-sm text-white/60">Not found.</div>
      ) : (
        <div className="animated-sheen rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl p-8 shadow-cyber-soft">
          <div className="text-xs font-medium text-white/60">
            {listing.category.replaceAll("_", " ")}
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
            {listing.title}
          </h1>
          <div className="mt-4 text-white/70">
            {listing.description}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-lg font-semibold text-white">
              {(listing.price_cents / 100).toFixed(2)} {listing.currency}
            </div>
            <Button
              variant="primary"
              size="lg"
              className="animated-sheen"
              onClick={() => {
                alert("Checkout flow will be added next (Stripe).");
              }}
            >
              Buy now
            </Button>
          </div>

          <div className="mt-8 text-xs text-white/50">
            Listing ID: {listing.id}
          </div>
        </div>
      )}
    </div>
  );
}
