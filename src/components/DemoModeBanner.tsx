export function DemoModeBanner() {
  return (
    <div className="border-b border-white/10 bg-black/40 text-white/80 backdrop-blur-xl">
      <div className="mx-auto w-full max-w-6xl px-4 py-2 text-xs">
        Demo Mode: UI-only preview (using local storage). Connect Supabase later for real auth + realtime.
      </div>
    </div>
  );
}
