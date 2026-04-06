"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/Button";

export default function AccountPage() {
  const enabled = useMemo(() => hasSupabaseEnv(), []);
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [resetCooldown, setResetCooldown] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!enabled) {
        if (!cancelled) setStatus("Authentication is not configured yet.");
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

  useEffect(() => {
    if (resetCooldown > 0) {
      const timer = setTimeout(() => setResetCooldown(0), resetCooldown);
      return () => clearTimeout(timer);
    }
  }, [resetCooldown]);

  function isRateLimitError(error: string | null | undefined) {
    if (!error) return false;
    const lower = error.toLowerCase();
    return lower.includes("rate limit") || lower.includes("too many requests") || lower.includes("overload");
  }

  function normalizeUsername(value: string) {
    return value.trim().toLowerCase();
  }

  function validateUsername(value: string) {
    const normalized = normalizeUsername(value);
    if (!normalized) return "Enter a username.";
    if (normalized.length < 3 || normalized.length > 24) return "Username must be 3-24 characters.";
    if (!/^[a-z0-9._]+$/.test(normalized)) return "Use letters, numbers, dot, or underscore only.";
    if (normalized.includes("admin")) return "Username cannot include 'admin'.";
    return null;
  }

  async function isUsernameTaken(candidate: string, ignoreUserId?: string) {
    const supabase = createClient();
    const { data, error } = await supabase.from("profiles").select("id,username").ilike("username", candidate).limit(20);
    if (error) {
      throw error;
    }

    return (data ?? []).some((row) => row.username?.toLowerCase() === candidate && row.id !== ignoreUserId);
  }

  async function signUp() {
    setStatus(null);
    if (!enabled) {
      setStatus("Authentication is not configured yet.");
      return;
    }

    if (!email || !password || !username) {
      setStatus("Enter email, password, and username.");
      toast({ title: "Missing fields", description: "Email, password, and username are required." });
      return;
    }

    const usernameError = validateUsername(username);
    if (usernameError) {
      setStatus(usernameError);
      toast({ title: "Invalid username", description: usernameError });
      return;
    }

    const normalized = normalizeUsername(username);

    try {
      const taken = await isUsernameTaken(normalized);
      if (taken) {
        setStatus("Username is already in use.");
        toast({ title: "Username unavailable", description: "Choose a different username." });
        return;
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Could not check username availability.";
      setStatus(detail);
      toast({ title: "Could not continue", description: detail });
      return;
    }

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: normalized,
        },
      },
    });
    if (error) {
      if (isRateLimitError(error.message)) {
        setResetCooldown(60000);
        setStatus("Too many sign-up attempts. Please wait 60 seconds and try again.");
        toast({ title: "Rate limited", description: "Too many attempts. Please wait a moment." });
      } else {
        setStatus(error.message);
        toast({ title: "Sign up failed", description: error.message });
      }
      return;
    }

    if (data.user) {
      const { error: profileError } = await supabase.from("profiles").upsert({ id: data.user.id, username: normalized });
      if (profileError) {
        setStatus(profileError.message);
        toast({ title: "Username not saved", description: profileError.message });
        return;
      }
    }

    setStatus("Signed up. You can now sign in.");
    toast({ title: "Signed up", description: "Now sign in to continue." });
  }

  async function sendResetPasswordEmail() {
    setStatus(null);
    if (!enabled) {
      setStatus("Authentication is not configured yet.");
      return;
    }

    if (!email) {
      setStatus("Enter your email to reset password.");
      toast({ title: "Missing email", description: "Enter your account email first." });
      return;
    }

    const supabase = createClient();
    const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/account` : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      if (isRateLimitError(error.message)) {
        setResetCooldown(60000);
        setStatus("Too many password reset attempts. Please wait 60 seconds and try again.");
        toast({ title: "Rate limited", description: "Too many attempts. Please wait a moment." });
      } else {
        setStatus(error.message);
        toast({ title: "Reset failed", description: error.message });
      }
      return;
    }

    setStatus("Password reset email sent.");
    toast({ title: "Check your email", description: "Use the reset link to set a new password." });
  }

  async function signIn() {
    setStatus(null);
    if (!enabled) {
      setStatus("Authentication is not configured yet.");
      return;
    }

    if (!email || !password) {
      setStatus("Enter both email and password.");
      toast({ title: "Missing fields", description: "Email and password are required." });
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
      setStatus("Authentication is not configured yet.");
      return;
    }
    const supabase = createClient();
    await supabase.auth.signOut();
    setUserEmail(null);
    setStatus("Signed out.");
    toast({ title: "Signed out" });
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="grid gap-8 lg:grid-cols-[1.05fr_1.2fr]">
        <section className="animated-sheen rounded-3xl border border-white/10 bg-black/35 p-7 shadow-cyber-soft">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/75">
            <span className="h-2 w-2 rounded-full bg-[color:var(--cyber)] shadow-cyber" />
            Secure access
          </div>

          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-white md:text-4xl">Welcome back</h1>
          <p className="mt-3 text-sm leading-6 text-white/70 md:text-base">
            Sign in to manage your account, join chat, and access your personalized CydeHub experience.
          </p>

          <div className="mt-8 space-y-3 text-sm text-white/70">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">Fast Google sign-in</div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">Email and password login</div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">Secure session handling</div>
          </div>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
            <span className="font-medium text-white">Current user:</span> {userEmail ?? "Not signed in"}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-black/45 p-6 shadow-cyber-soft md:p-8">
          <h2 className="text-2xl font-semibold tracking-tight text-white">Sign in</h2>
          <p className="mt-2 text-sm text-white/65">Use your email and password.</p>

          {status ? (
            <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-sm text-white/80">
              {status}
            </div>
          ) : null}

          <div className="mt-6 space-y-4">
            <label className="block">
              <div className="text-sm font-medium text-white">Email</div>
              <input
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:ring-2 focus:ring-[color:var(--cyber)]/30"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="you@example.com"
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
                placeholder="Enter your password"
                required
              />
            </label>

            <label className="block">
              <div className="text-sm font-medium text-white">Username</div>
              <input
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:ring-2 focus:ring-[color:var(--cyber)]/30"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                type="text"
                placeholder="your.username"
                required
              />
              <div className="mt-2 text-xs text-white/50">Unique name, 3-24 chars, cannot include &quot;admin&quot;.</div>
            </label>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                variant="secondary"
                className="flex-1 bg-white text-black hover:bg-white/90"
                onClick={signIn}
                disabled={!enabled}
              >
                Sign in
              </Button>
              <Button type="button" variant="secondary" className="flex-1" onClick={signUp} disabled={!enabled || resetCooldown > 0}>
                {resetCooldown > 0 ? "Please wait..." : "Create account"}
              </Button>
            </div>

            <Button type="button" variant="secondary" onClick={sendResetPasswordEmail} disabled={!enabled || resetCooldown > 0}>
              {resetCooldown > 0 ? "Please wait..." : "Forgot password?"}
            </Button>

            {userEmail ? (
              <Button type="button" variant="secondary" className="mt-4" onClick={signOut} disabled={!enabled}>
                Sign out
              </Button>
            ) : null}
          </div>

          {!enabled ? (
            <div className="mt-5 rounded-2xl border border-amber-400/25 bg-amber-100/10 px-4 py-3 text-sm text-amber-100">
              Authentication is not configured. Set Supabase environment variables in Vercel to activate sign-in.
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
