"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { demoStore } from "@/lib/demo/store";
import type { ListingCategory } from "@/lib/models";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/toast";

const categories: { label: string; value: ListingCategory }[] = [
  { label: "Console game", value: "console_game" },
  { label: "Subscription", value: "subscription" },
  { label: "Digital account", value: "digital_account" },
  { label: "Coaching", value: "coaching" },
  { label: "Tournament entry", value: "tournament_entry" },
];

export default function NewListingPage() {
  const enabled = useMemo(() => hasSupabaseEnv(), []);
  const router = useRouter();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ListingCategory>("coaching");
  const [price, setPrice] = useState("25.00");
  const [currency, setCurrency] = useState("USD");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const numeric = Number(price);
    if (!Number.isFinite(numeric) || numeric <= 0) {
      setError("Enter a valid price.");
      return;
    }

    setSaving(true);
    try {
      if (!enabled) {
        const listing = demoStore.createListing({
          title,
          description,
          category,
          price_cents: Math.round(numeric * 100),
          currency,
        });
        toast({
          title: "Listing created",
          description: "Saved locally (demo mode).",
        });
        router.push(`/marketplace/${listing.id}`);
        return;
      }

      const supabase = createClient();

      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr) throw userErr;
      if (!user) {
        setError("You must be signed in to create a listing.");
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

      const { data, error: insErr } = await supabase
        .from("listings")
        .insert({
          title,
          description,
          category,
          price_cents: Math.round(numeric * 100),
          currency,
          seller_id: user.id,
        })
        .select("id")
        .single();

      if (insErr) throw insErr;

      toast({
        title: "Listing created",
        description: "Your listing is live in the marketplace.",
      });

      router.push(`/marketplace/${data.id}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg);
      toast({ title: "Could not create listing", description: msg });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight text-white">Create listing</h1>
      <p className="mt-2 text-white/70">
        Sell digital products and services. Payments/checkout will be added next.
      </p>

      {error ? (
        <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-50 px-5 py-4 text-sm text-red-900 dark:border-red-400/20 dark:bg-red-950/30 dark:text-red-100">
          {error}
        </div>
      ) : null}

      <form
        className="mt-8 space-y-4 rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl p-6 shadow-cyber-soft"
        onSubmit={onSubmit}
      >
        <label className="block">
          <div className="text-sm font-medium text-white">Title</div>
          <input
            className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:ring-2 focus:ring-[color:var(--cyber)]/30"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. PS5 Game Key - Elden Ring"
            required
          />
        </label>

        <label className="block">
          <div className="text-sm font-medium text-white">Description</div>
          <textarea
            className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:ring-2 focus:ring-[color:var(--cyber)]/30"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            placeholder="Describe what the buyer will receive and delivery details."
            required
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <div className="text-sm font-medium text-white">Category</div>
            <select
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-[color:var(--cyber)]/30"
              value={category}
              onChange={(e) => setCategory(e.target.value as ListingCategory)}
            >
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <div className="text-sm font-medium text-white">Currency</div>
            <input
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white uppercase outline-none placeholder:text-white/40 focus:ring-2 focus:ring-[color:var(--cyber)]/30"
              value={currency}
              onChange={(e) => setCurrency(e.target.value.toUpperCase())}
              maxLength={3}
              required
            />
          </label>
        </div>

        <label className="block">
          <div className="text-sm font-medium text-white">Price</div>
          <input
            className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:ring-2 focus:ring-[color:var(--cyber)]/30"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            inputMode="decimal"
            required
          />
        </label>

        <Button type="submit" disabled={saving} size="lg" className="w-full animated-sheen">
          {saving ? "Creating…" : "Create listing"}
        </Button>
      </form>

      <div className="mt-6 text-sm text-white/60">
        Need an account? Go to <a className="underline" href="/account">Account</a>.
      </div>
    </div>
  );
}
