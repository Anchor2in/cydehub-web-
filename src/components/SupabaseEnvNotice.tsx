export function SupabaseEnvNotice() {
  return (
    <div className="rounded-2xl border border-amber-300/40 bg-amber-50 px-5 py-4 text-sm text-amber-950 dark:border-amber-200/20 dark:bg-amber-950/30 dark:text-amber-100">
      <div className="font-medium">Supabase not configured</div>
      <div className="mt-1 text-amber-950/80 dark:text-amber-100/80">
        Add <span className="font-mono">NEXT_PUBLIC_SUPABASE_URL</span> and{" "}
        <span className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</span> to
        your <span className="font-mono">.env.local</span>, then restart the
        dev server.
      </div>
    </div>
  );
}
