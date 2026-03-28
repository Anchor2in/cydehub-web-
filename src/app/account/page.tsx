"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { demoStore } from "@/lib/demo/store";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/Button";

export default function AccountPage() {
  const enabled = useMemo(() => hasSupabaseEnv(), []);
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!enabled) {
        const user = demoStore.getUser();
        if (!cancelled) setUserEmail(user?.email ?? null);
        return;
      }
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!cancelled) setUserEmail(user?.email ?? null);
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  async function signUp() {
    setStatus(null);
    if (!enabled) {
      if (!email) {
        setStatus("Enter an email to sign in (demo mode).");
        toast({ title: "Email required", description: "Enter your email to continue." });
        return;
      }
      demoStore.signIn(email);
      setUserEmail(email);
      setStatus("Signed in (demo mode)." );
      toast({ title: "Signed in", description: "Demo mode account active." });
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setStatus(error.message);
      toast({ title: "Sign up failed", description: error.message });
      return;
    }
    setStatus("Signed up. You can now sign in.");
    toast({ title: "Signed up", description: "Now sign in to continue." });
  }

  async function signIn() {
    setStatus(null);
    if (!enabled) {
      if (!email) {
        setStatus("Enter an email to sign in (demo mode).");
        toast({ title: "Email required", description: "Enter your email to continue." });
        return;
      }
      demoStore.signIn(email);
      setUserEmail(email);
      setStatus("Signed in (demo mode)." );
      toast({ title: "Signed in", description: "Demo mode account active." });
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setStatus(error.message);
      toast({ title: "Sign in failed", description: error.message });
      return;
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUserEmail(user?.email ?? null);
    setStatus("Signed in.");
    toast({ title: "Signed in", description: "Welcome back." });
  }

  async function signOut() {
    setStatus(null);
    if (!enabled) {
      demoStore.signOut();
      setUserEmail(null);
      setStatus("Signed out (demo mode)." );
      toast({ title: "Signed out", description: "Demo account cleared." });
      return;
    }
    const supabase = createClient();
    await supabase.auth.signOut();
    setUserEmail(null);
    setStatus("Signed out.");
    toast({ title: "Signed out" });
  }

  async function signInWithGoogle() {
    setStatus(null);
    if (!enabled) return;

    const supabase = createClient();
    const origin = window.location.origin;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) {
      setStatus(error.message);
      toast({ title: "Google sign-in failed", description: error.message });
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-10">
      <div className="flex items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Account</h1>
          <p className="mt-2 text-white/70">
            Sign up / sign in to create listings and participate in chat.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70">
          <span className="h-2 w-2 rounded-full bg-[color:var(--cyber)] shadow-cyber" />
          {enabled ? "Supabase" : "Demo"}
        </div>
      </div>

      {status ? (
        <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-sm text-white/80">
          {status}
        </div>
      ) : null}

      <div className="mt-8 rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl p-6 shadow-cyber-soft">
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm text-white/80">
            <span className="font-medium text-white">Current user:</span>{" "}
            {userEmail ?? "Not signed in"}
          </div>
          <a className="text-sm font-medium text-[color:var(--cyber)] hover:underline" href="/sell/new">
            Create listing
          </a>
        </div>

        <div className="mt-6">
          <Button
            variant="secondary"
            size="lg"
            className="w-full"
            onClick={() => void signInWithGoogle()}
            disabled={!enabled}
          >
            Continue with Google
          </Button>
        </div>

        <div className="mt-6 space-y-4">
          <label className="block">
            <div className="text-sm font-medium text-white">Email</div>
            <input
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:ring-2 focus:ring-[color:var(--cyber)]/30"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
            />
          </label>

          <label className="block">
            <div className="text-sm font-medium text-white">Password</div>
            <input
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:ring-2 focus:ring-[color:var(--cyber)]/30"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-3">
            <Button type="button" variant="primary" onClick={signIn} disabled={!enabled}>
              Sign in
            </Button>
            <Button type="button" variant="secondary" onClick={signUp} disabled={!enabled}>
              Sign up
            </Button>
            <Button type="button" variant="secondary" onClick={signOut}>
              Sign out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
