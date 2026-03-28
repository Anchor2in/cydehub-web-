import { demoStore } from "@/lib/demo/store";
import { Scroll3D } from "@/components/ui/Scroll3D";

export default function Home() {
  const testimonials = demoStore.getTestimonials();

  return (
    <div>
      <section className="mx-auto w-full max-w-6xl px-4 py-16">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-4 py-2 text-xs text-white/80">
              <span className="h-2 w-2 rounded-full bg-[color:var(--cyber)] shadow-cyber" />
              Less friction, more wins.
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">
              A no-fuss marketplace for gamers who ship fast.
            </h1>
            <p className="text-lg leading-8 text-white/70">
              Buy and sell digital games, subscriptions, accounts, coaching, and services — with chat, tournaments, and updates built in.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href="/marketplace"
                className="inline-flex items-center justify-center rounded-full bg-[color:var(--cyber)] px-6 py-3 text-sm font-medium text-black shadow-cyber hover:shadow-cyber-strong transition-all duration-200 animated-sheen"
              >
                Explore Marketplace
              </a>
              <a
                href="/sell/new"
                className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-white hover:bg-white/10 transition-all duration-200"
              >
                Start selling
              </a>
            </div>
            <div className="flex items-center gap-3 text-xs text-white/60">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
                <span className="text-[color:var(--cyber)]">5.0</span> Demo UX rating
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
                Instant demo mode
              </span>
            </div>
          </div>

          <Scroll3D>
            <div className="animated-sheen rounded-3xl border border-white/10 bg-black/35 backdrop-blur-xl p-8 shadow-cyber-soft">
              <div className="space-y-4">
                <div className="text-sm font-medium text-white/70">Quick preview</div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="font-semibold text-white">Featured: 1v1 Coaching Session</div>
                  <div className="mt-2 text-sm text-white/70">
                    Improve your rank with a verified coach. Includes VOD review + live practice.
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm font-medium text-white">$25</div>
                    <div className="text-xs text-white/50">Instant delivery</div>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
                    <div className="font-medium text-white">Marketplace</div>
                    <div className="text-white/60">Listings + search</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
                    <div className="font-medium text-white">Community</div>
                    <div className="text-white/60">Blog + updates</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
                    <div className="font-medium text-white">Esports</div>
                    <div className="text-white/60">Tournaments</div>
                  </div>
                </div>
              </div>
            </div>
          </Scroll3D>
        </div>

        <div className="mt-10 grid gap-3 rounded-3xl border border-white/10 bg-black/30 p-5 text-sm text-white/70 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="font-medium text-white">Fast by design</div>
            <div className="mt-1">Create a listing in under a minute.</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="font-medium text-white">Clear flows</div>
            <div className="mt-1">Every button has a purpose and feedback.</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="font-medium text-white">Community-first</div>
            <div className="mt-1">Chat, tournaments, and updates in one hub.</div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-16">
        <div className="flex items-end justify-between gap-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-white">What you can do</h2>
            <p className="mt-2 text-white/70">
              Built for players, sellers, and teams that move quickly.
            </p>
          </div>
          <a
            href="/marketplace"
            className="text-sm font-medium text-[color:var(--cyber)] hover:underline"
          >
            See what’s live
          </a>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="animated-sheen rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl p-6 shadow-cyber-soft">
            <div className="text-lg font-semibold text-white">Unlimited browsing</div>
            <div className="mt-2 text-sm text-white/70">
              Discover console games, subscriptions, accounts, coaching, and services.
            </div>
            <div className="mt-4">
              <a className="text-sm font-medium text-[color:var(--cyber)] hover:underline" href="/marketplace">
                Browse marketplace
              </a>
            </div>
          </div>

          <div className="animated-sheen rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl p-6 shadow-cyber-soft">
            <div className="text-lg font-semibold text-white">Ship listings fast</div>
            <div className="mt-2 text-sm text-white/70">
              Create a listing with clear fields, pricing, and category presets.
            </div>
            <div className="mt-4">
              <a className="text-sm font-medium text-[color:var(--cyber)] hover:underline" href="/sell/new">
                Create a listing
              </a>
            </div>
          </div>

          <div className="animated-sheen rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl p-6 shadow-cyber-soft">
            <div className="text-lg font-semibold text-white">Chat that feels live</div>
            <div className="mt-2 text-sm text-white/70">
              Demo mode works offline; Supabase realtime plugs in later.
            </div>
            <div className="mt-4">
              <a className="text-sm font-medium text-[color:var(--cyber)] hover:underline" href="/chat">
                Open chat
              </a>
            </div>
          </div>

          <div className="animated-sheen rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl p-6 shadow-cyber-soft">
            <div className="text-lg font-semibold text-white">Tournaments + updates</div>
            <div className="mt-2 text-sm text-white/70">
              Track upcoming events and publish updates to your community.
            </div>
            <div className="mt-4 flex gap-4">
              <a className="text-sm font-medium text-[color:var(--cyber)] hover:underline" href="/tournaments">
                View tournaments
              </a>
              <a className="text-sm font-medium text-[color:var(--cyber)] hover:underline" href="/blog">
                Read updates
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-16">
        <h2 className="text-2xl font-semibold tracking-tight text-white">Hear it from the players</h2>
        <p className="mt-2 text-white/70">
          A few quotes to preview the vibe. Replace these with real testimonials anytime.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="animated-sheen rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl p-6 shadow-cyber-soft"
            >
              <div className="text-sm text-white/80">“{t.quote}”</div>
              <div className="mt-4 text-sm font-semibold text-white">{t.name}</div>
              <div className="text-xs text-white/60">{t.title}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-20">
        <Scroll3D>
          <div className="animated-sheen rounded-3xl border border-white/10 bg-black/35 backdrop-blur-xl p-8 shadow-cyber-soft">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-white">Less friction, more progress.</h2>
                <p className="mt-2 text-white/70">
                  Ready when you are. Explore the marketplace or create your first listing.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <a
                  href="/marketplace"
                  className="inline-flex items-center justify-center rounded-full bg-[color:var(--cyber)] px-6 py-3 text-sm font-medium text-black shadow-cyber hover:shadow-cyber-strong transition-all duration-200 animated-sheen"
                >
                  Browse
                </a>
                <a
                  href="/sell/new"
                  className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-white hover:bg-white/10 transition-all duration-200"
                >
                  Create listing
                </a>
              </div>
            </div>
          </div>
        </Scroll3D>
      </section>
    </div>
  );
}
