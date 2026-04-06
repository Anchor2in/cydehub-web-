import { Scroll3D } from "@/components/ui/Scroll3D";

export default function Home() {
  const testimonials = [
    {
      quote: "The platform feels fast, clean, and easy to use even on mobile.",
      name: "James K.",
      title: "Community member",
    },
    {
      quote: "Account setup is smooth and the chat experience is exactly what we needed.",
      name: "Nina O.",
      title: "Creator",
    },
    {
      quote: "Blog and chat in one place makes it easier to keep everyone updated.",
      name: "Victor M.",
      title: "Team lead",
    },
  ];

  return (
    <div className="relative isolate overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-[-140px] top-[-120px] h-[360px] w-[360px] rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="absolute right-[-160px] top-[80px] h-[420px] w-[420px] rounded-full bg-fuchsia-300/15 blur-3xl" />
        <div className="absolute bottom-[-120px] left-1/2 h-[320px] w-[320px] -translate-x-1/2 rounded-full bg-emerald-300/15 blur-3xl" />
        <svg
          className="absolute right-0 top-6 h-[260px] w-[460px] opacity-40"
          viewBox="0 0 460 260"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path d="M10 180C90 70 170 250 250 140C310 55 365 120 450 20" stroke="rgba(125,255,211,0.55)" strokeWidth="2" />
          <path d="M0 220C80 110 165 280 245 170C310 80 370 150 455 55" stroke="rgba(139,117,255,0.5)" strokeWidth="2" />
        </svg>
      </div>
      <section className="mx-auto w-full max-w-6xl px-4 py-16">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-4 py-2 text-xs text-white/80">
              <span className="h-2 w-2 rounded-full bg-[color:var(--cyber)] shadow-cyber" />
              Less friction, more wins.
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">
              A social hub for all. Make the right move.
            </h1>
            <p className="text-lg leading-8 text-white/70">
              Connect with your community through live chat, stories, and updates built for players.
            </p>
            <div>
              <a
                href="/chat"
                className="inline-flex items-center justify-center rounded-full bg-[color:var(--cyber)] px-6 py-3 text-sm font-medium text-black shadow-cyber hover:shadow-cyber-strong transition-all duration-200 animated-sheen"
              >
                Join chat
              </a>
            </div>
            <div className="flex items-center gap-3 text-xs text-white/60">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
                <span className="text-[color:var(--cyber)]">5.0</span> Community rating
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
                Instant access
              </span>
            </div>
          </div>

          <Scroll3D>
            <div className="animated-sheen rounded-3xl border border-white/10 bg-black/35 backdrop-blur-xl p-8 shadow-cyber-soft">
              <div className="space-y-4">
                <div className="text-sm font-medium text-white/70">Quick preview</div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="font-semibold text-white">Featured blog: Winning your audience in 2026</div>
                  <div className="mt-2 text-sm text-white/70">
                    A short strategy guide on growing community trust and conversion through content.
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm font-medium text-white">New article</div>
                    <div className="text-xs text-white/50">2 min read</div>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
                    <div className="font-medium text-white">Updates</div>
                    <div className="text-white/60">Blog + announcements</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
                    <div className="font-medium text-white">Live chat</div>
                    <div className="text-white/60">Real-time discussions</div>
                  </div>
                </div>
              </div>
            </div>
          </Scroll3D>
        </div>

        <div className="mt-10 grid gap-3 rounded-3xl border border-white/10 bg-black/30 p-5 text-sm text-white/70 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="font-medium text-white">Fast by design</div>
            <div className="mt-1">Jump into conversations in seconds.</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="font-medium text-white">Clear flows</div>
            <div className="mt-1">Every button has a purpose and feedback.</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="font-medium text-white">Community-first</div>
            <div className="mt-1">Chat and updates in one hub.</div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-16">
        <div className="flex items-end justify-between gap-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-white">What you can do</h2>
            <p className="mt-2 text-white/70">
              Built for players and teams that move quickly.
            </p>
          </div>
          <a
            href="/blog"
            className="text-sm font-medium text-[color:var(--cyber)] hover:underline"
          >
            Read the latest
          </a>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="animated-sheen rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl p-6 shadow-cyber-soft">
            <div className="text-lg font-semibold text-white">Community updates</div>
            <div className="mt-2 text-sm text-white/70">
              Follow stories, updates, and announcements from across CydeHub.
            </div>
            <div className="mt-4">
              <a className="text-sm font-medium text-[color:var(--cyber)] hover:underline" href="/blog">
                Open blog
              </a>
            </div>
          </div>

          <div className="animated-sheen rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl p-6 shadow-cyber-soft">
            <div className="text-lg font-semibold text-white">Join the conversation</div>
            <div className="mt-2 text-sm text-white/70">
              Connect in real time with players and teams in chat.
            </div>
            <div className="mt-4">
              <a className="text-sm font-medium text-[color:var(--cyber)] hover:underline" href="/chat">
                Open chat
              </a>
            </div>
          </div>

          <div className="animated-sheen rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl p-6 shadow-cyber-soft">
            <div className="text-lg font-semibold text-white">Chat that feels live</div>
            <div className="mt-2 text-sm text-white/70">
              Built for active conversations with secure account sign-in.
            </div>
            <div className="mt-4">
              <a className="text-sm font-medium text-[color:var(--cyber)] hover:underline" href="/chat">
                Open chat
              </a>
            </div>
          </div>

        </div>
      </section>

      <section id="social-boosting" className="mx-auto w-full max-w-6xl px-4 pb-16">
        <div className="animated-sheen rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl p-6 shadow-cyber-soft md:p-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-white">Social Boosting Services</h2>
              <p className="mt-2 text-sm text-white/70 md:text-base">
                We now offer social growth packages for creators and brands.
              </p>
            </div>
            <a
              href="/chat"
              className="text-sm font-medium text-[color:var(--cyber)] hover:underline"
            >
              Request a package
            </a>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-base font-semibold text-white">Instagram</div>
              <div className="mt-2 text-sm text-white/70">Followers, likes, and post engagement boosts.</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-base font-semibold text-white">TikTok</div>
              <div className="mt-2 text-sm text-white/70">Followers, likes, and short-form video reach.</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-base font-semibold text-white">YouTube</div>
              <div className="mt-2 text-sm text-white/70">Subscribers, likes, and video views packages.</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-base font-semibold text-white">Snapchat</div>
              <div className="mt-2 text-sm text-white/70">Followers and story interaction support.</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-16">
        <h2 className="text-2xl font-semibold tracking-tight text-white">Hear it from the players</h2>
        <p className="mt-2 text-white/70">
          A few quotes to preview the vibe from our community. Replace these with real testimonials anytime.
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
                  Ready when you are. Jump into chat or catch up on updates.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <a
                  href="/chat"
                  className="inline-flex items-center justify-center rounded-full bg-[color:var(--cyber)] px-6 py-3 text-sm font-medium text-black shadow-cyber hover:shadow-cyber-strong transition-all duration-200 animated-sheen"
                >
                  Open chat
                </a>
                <a
                  href="/blog"
                  className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-white hover:bg-white/10 transition-all duration-200"
                >
                  Read blog
                </a>
              </div>
            </div>
          </div>
        </Scroll3D>
      </section>
    </div>
  );
}
