import type { BlogPost, Listing, Tournament } from "@/lib/models";

const LS = {
  listings: "cydehub_demo_listings",
  posts: "cydehub_demo_posts",
  tournaments: "cydehub_demo_tournaments",
  chat: "cydehub_demo_chat_messages",
  user: "cydehub_demo_user",
} as const;

type DemoUser = {
  id: string;
  email: string;
};

type DemoChatMessage = {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
};

type DemoTestimonial = {
  quote: string;
  name: string;
  title: string;
};

function safeParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function seedListings(): Listing[] {
  const now = new Date();
  return [
    {
      id: uid("lst"),
      title: "1v1 Coaching Session (Ranked Climb)",
      description:
        "Live coaching session + VOD review. Includes a tailored training plan and match analysis.",
      category: "coaching",
      price_cents: 2500,
      currency: "USD",
      seller_id: "demo_seller",
      created_at: new Date(now.getTime() - 1000 * 60 * 60 * 6).toISOString(),
    },
    {
      id: uid("lst"),
      title: "PSN Subscription (1 Month)",
      description:
        "Fast delivery. Works for most regions. Details provided after purchase.",
      category: "subscription",
      price_cents: 999,
      currency: "USD",
      seller_id: "demo_seller",
      created_at: new Date(now.getTime() - 1000 * 60 * 60 * 24).toISOString(),
    },
    {
      id: uid("lst"),
      title: "Console Game Key — Action RPG",
      description:
        "Digital key for console. Includes instructions and support.",
      category: "console_game",
      price_cents: 3499,
      currency: "USD",
      seller_id: "demo_seller",
      created_at: new Date(now.getTime() - 1000 * 60 * 60 * 48).toISOString(),
    },
  ];
}

function seedPosts(): BlogPost[] {
  const now = new Date();
  const base: BlogPost[] = [
    {
      id: uid("post"),
      title: "Welcome to CydeHub",
      content:
        "This is a demo feed. Once Supabase is connected, posts will load from the database.",
      author_id: "demo_author",
      created_at: new Date(now.getTime() - 1000 * 60 * 60 * 12).toISOString(),
    },
    {
      id: uid("post"),
      title: "Marketplace launch checklist",
      content:
        "- Create your first listing\n- Test chat\n- Add tournament schedules\n\nNext: payments + moderation.",
      author_id: "demo_author",
      created_at: new Date(now.getTime() - 1000 * 60 * 60 * 36).toISOString(),
    },
  ];

  const extra = [
    {
      title: "Patch Notes: Faster Marketplace Search",
      content:
        "We tightened the UI and improved client-side filtering. Next up: sorting + saved searches.",
    },
    {
      title: "The 2026 Controller Trend: Hall-Effect Everywhere",
      content:
        "Hall-effect sticks keep showing up in pro gear because they fight drift. If you play daily, it’s worth the upgrade.",
    },
    {
      title: "Gaming Laptops: What Actually Matters (GPU, Cooling, Screen)",
      content:
        "Don’t get distracted by marketing. For real-world FPS and comfort, prioritize GPU tier, sustained cooling, and a good panel.",
    },
    {
      title: "How We’d Moderate a Digital Marketplace",
      content:
        "A healthy marketplace needs clear categories, dispute flows, and anti-fraud signals — even before payments ship.",
    },
    {
      title: "Keyboard Switches for Competitive Play: Linear vs Tactile",
      content:
        "Linears can feel faster, tactiles can feel more precise. The best choice is the one you can repeat consistently under pressure.",
    },
    {
      title: "Console Storage 101: NVMe, Expansion Cards, and Real Load Times",
      content:
        "Capacity is only half the story. Matching the console’s required speed keeps performance consistent across big modern games.",
    },
    {
      title: "A Simple Guide to HDR for Games",
      content:
        "Good HDR is about contrast and tone mapping, not maximum brightness. Calibrate once and your games will look instantly cleaner.",
    },
    {
      title: "Why Some Online Games Feel ‘Laggy’ Even on Good Internet",
      content:
        "Ping is only one factor. Jitter, bufferbloat, Wi‑Fi interference, and server tick rate can make inputs feel delayed.",
    },
    {
      title: "Pro Settings Mythbusters: Copying Sensitivity Isn’t Enough",
      content:
        "Sensitivity, DPI, FOV, and posture work together. A ‘pro’ config only helps if it matches your desk space and muscle memory.",
    },
    {
      title: "Game Backlogs: The Best Way to Actually Finish More Games",
      content:
        "Pick a small rotation. One story game, one multiplayer, one ‘relax’ title. Finish becomes possible when the queue is realistic.",
    },
    {
      title: "Headset Buying Guide: Imaging Beats Bass",
      content:
        "For FPS games, positional imaging and comfort matter more than huge bass. A decent mic is the cherry on top.",
    },
    {
      title: "Streaming Starter Kit: What to Upgrade First",
      content:
        "Audio first, lighting second, camera third. Viewers forgive video quality; they don’t forgive noisy, uneven audio.",
    },
    {
      title: "DualSense Features in PC Games: What You Need to Know",
      content:
        "Haptics and adaptive triggers can work on PC — but only in some titles and sometimes only wired. Check before you buy accessories.",
    },
    {
      title: "Xbox Cloud Gaming: The Best Use Case in 2026",
      content:
        "It shines when you treat it like ‘instant access’ — quick sessions, new releases sampling, and travel. For competitive play, local still wins.",
    },
    {
      title: "When to Choose 120Hz vs 4K on Console",
      content:
        "If you play shooters or fighters, 120Hz responsiveness often beats raw pixels. For cinematic story games, 4K can be the vibe.",
    },
    {
      title: "A Better Way to Write Patch Notes",
      content:
        "Players want impact, not paragraphs. Lead with ‘what changed’, then ‘why’, then ‘how to test it’.",
    },
    {
      title: "The Rise of ‘Micro-Coaching’ Sessions",
      content:
        "Short sessions with clear goals can outperform marathon lessons. Review one mistake category at a time and improvement becomes measurable.",
    },
    {
      title: "Gaming Mice: Shapes > Sensors",
      content:
        "Modern sensors are all excellent. Shape and grip style decide consistency. Try shapes first; specs second.",
    },
    {
      title: "What We Learned Building Demo Mode",
      content:
        "Local-first mock data keeps UI moving even when backend isn’t ready. It’s the fastest way to iterate on layout and interactions.",
    },
    {
      title: "How to Price Digital Items Without Racing to the Bottom",
      content:
        "Price anchors, bundles, and clear outcomes matter. Sell confidence, not just ‘cheap’.",
    },
    {
      title: "SSD Health for Gamers: The ‘Write Amplification’ Basics",
      content:
        "Installing and patching big games is heavy on writes. Leave free space, keep firmware updated, and don’t obsess over minor wear.",
    },
    {
      title: "Accessibility Wins: The Settings Every Game Should Copy",
      content:
        "Subtitle sizing, remapping, color filters, and motion reduction are no longer ‘nice to have’. They’re table stakes.",
    },
    {
      title: "‘Performance Mode’ Isn’t One Setting",
      content:
        "Some games trade resolution for framerate; others adjust lighting, crowd density, or ray tracing. Read the mode description — it matters.",
    },
    {
      title: "Gaming Monitors: Don’t Ignore the Stand",
      content:
        "Ergonomics is performance. A stable, adjustable stand keeps posture consistent which helps aim and reduces fatigue.",
    },
    {
      title: "Why We’re Adding Channels to Chat",
      content:
        "Channels keep communities readable. ‘General’ is great, but trading, tournaments, and support deserve separate lanes.",
    },
    {
      title: "Creator Economy: Bundles Are the New Meta",
      content:
        "People buy outcomes. Bundles that combine guides + VOD review + practice plans convert better than isolated one-offs.",
    },
    {
      title: "Neon UI Without Eye Strain",
      content:
        "High contrast doesn’t need harsh whites. Use neon accents sparingly and keep body text in softer off‑white.",
    },
    {
      title: "Game Keys, Regions, and Common Buyer Questions",
      content:
        "The three questions are always: region lock, delivery timing, and refund policy. Put the answers in the listing header.",
    },
    {
      title: "PS5 System Updates: What to Watch For",
      content:
        "Firmware changes can affect storage compatibility, controller features, and network stability. Update, then run a quick ‘sanity test’ session.",
    },
    {
      title: "Xbox Accessories: Which Ones Actually Change Gameplay",
      content:
        "Back paddles, low-latency headsets, and high-refresh monitors matter. Cosmetic upgrades are fun, but they won’t move your rank.",
    },
    {
      title: "Laptop Cooling Pads: Worth It?",
      content:
        "A good pad can reduce heat soak and fan noise. It won’t turn a thin laptop into a desktop, but it can stabilize performance.",
    },
    {
      title: "Battle Pass Fatigue Is Real",
      content:
        "Too many timed grinds turns games into chores. The best seasons give flexible progression and meaningful rewards, not endless checklists.",
    },
    {
      title: "Aiming Consistency: The 10-Minute Warmup",
      content:
        "A short routine beats random matches. Track one metric (accuracy or time-to-kill drills) and you’ll see progress quickly.",
    },
    {
      title: "What Makes a Great Tournament Page",
      content:
        "Clear start time, rules, region, and bracket format. Then add one ‘how to join’ step that fits on a single line.",
    },
    {
      title: "GPU Pricing: The Quiet Factors Most People Miss",
      content:
        "VRAM, memory bandwidth, and cooling design affect sustained performance. A cheaper card can win if it stays cool and boosts longer.",
    },
    {
      title: "Why Some Games Get ‘Stutter’ After Updates",
      content:
        "Shader rebuilds, asset streaming changes, or driver mismatches. Give it one clean restart and check for driver updates before you panic.",
    },
    {
      title: "VR in 2026: Great Games, Better Comfort",
      content:
        "The biggest improvement isn’t raw resolution — it’s comfort and onboarding. The best VR sessions are the ones you’ll actually repeat.",
    },
    {
      title: "Cloud Saves: The Hidden Risk of Cross-Platform Switching",
      content:
        "Not every game merges saves cleanly. Before you switch platforms, confirm whether progression syncs or overwrites.",
    },
    {
      title: "Your First Mechanical Keyboard: A Minimal Checklist",
      content:
        "Pick a layout you won’t regret, a switch weight you can type on all day, and a board with good stabilizers. Fancy lights come later.",
    },
    {
      title: "Why We Love Short Hardware Reviews",
      content:
        "Players want ‘does it help and why?’ A quick verdict with one chart beats ten paragraphs of marketing copy.",
    },
    {
      title: "Game Audio Mixes: How to Hear Footsteps Without Cheating",
      content:
        "Reduce music, keep SFX high, and avoid extreme EQ that nukes clarity. A clean mix helps awareness without sounding terrible.",
    },
    {
      title: "The Best ‘Small’ Upgrades for Your Setup",
      content:
        "Mouse skates, a desk mat, and a good chair. The cheap improvements that you feel every single day.",
    },
    {
      title: "Marketplace Safety: 5 Red Flags to Avoid",
      content:
        "New account + rushed sale + vague description + off-platform payment requests + no proof. One is a warning; three is a hard no.",
    },
    {
      title: "Choosing a Gaming Phone: Thermal Throttling Matters",
      content:
        "A phone can benchmark high and still drop frames after 10 minutes. Look for sustained performance and predictable heat management.",
    },
    {
      title: "A Quick Look at Modern Anti-Cheat",
      content:
        "The best systems combine detection, friction, and enforcement. The goal isn’t perfection — it’s making cheating expensive and inconvenient.",
    },
    {
      title: "How to Write a Listing That Sells",
      content:
        "Lead with the outcome, add proof, then list delivery steps. If buyers can imagine the result, they’ll click ‘Buy’.",
    },
    {
      title: "What ‘Low Latency’ Actually Means",
      content:
        "Input latency is a chain: device → OS → game → display. Fix the slowest link first (often the display mode or wireless interference).",
    },
    {
      title: "Razer-Style RGB: How to Make It Look Premium",
      content:
        "Use one primary accent and one secondary. Avoid rainbow cycling. Subtle gradients look more expensive than max brightness.",
    },
    {
      title: "The Best Way to Announce a New Feature",
      content:
        "Show a screenshot, summarize the benefit in one line, then provide a short ‘try it now’ list. That’s it.",
    },
    {
      title: "Game News vs Patch Notes: Different Readers, Different Format",
      content:
        "News posts can be narrative. Patch notes must be scannable. Write for the job your reader is trying to do.",
    },
  ] as const;

  const seededExtras: BlogPost[] = extra.map((p, idx) => ({
    id: uid("post"),
    title: p.title,
    content: p.content,
    author_id: "demo_author",
    created_at: new Date(now.getTime() - 1000 * 60 * 60 * (48 + idx * 6)).toISOString(),
  }));

  return [...base, ...seededExtras];
}

function seedTournaments(): Tournament[] {
  const now = new Date();
  const base: Tournament[] = [
    {
      id: uid("t"),
      title: "Weekend 1v1 Cup",
      game: "Fighting Arena",
      starts_at: new Date(now.getTime() + 1000 * 60 * 60 * 24).toISOString(),
      created_by: "demo_admin",
      created_at: new Date(now.getTime() - 1000 * 60 * 10).toISOString(),
    },
    {
      id: uid("t"),
      title: "Squad Championship Qualifiers",
      game: "Battle Royale",
      starts_at: new Date(now.getTime() + 1000 * 60 * 60 * 72).toISOString(),
      created_by: "demo_admin",
      created_at: new Date(now.getTime() - 1000 * 60 * 30).toISOString(),
    },
  ];

  const extra = [
    { title: "Console Clash Open #01", game: "Action RPG Arena" },
    { title: "CydeHub Ranked Circuit Qualifier", game: "Tactical Shooter" },
    { title: "Midnight Duos Scrim", game: "Battle Royale" },
    { title: "Creator Showmatch Night", game: "Hero Brawler" },
    { title: "Cross-Platform Championship", game: "Racing Sim" },
    { title: "Weekly Team Deathmatch Trials", game: "Arena FPS" },
    { title: "PlayStation Community Throwdown", game: "Sports Football" },
    { title: "Xbox Weekend Rivals", game: "Open World Action" },
    { title: "Keyboard & Mouse Masters", game: "MOBA" },
    { title: "Controller Legends Invitational", game: "Fighting Arena" },
    { title: "Mobile Legends Sprint Cup", game: "Mobile MOBA" },
    { title: "Tactical Tuesday Tournament", game: "Tactical Shooter" },
    { title: "Co-op Raid Speedrun Challenge", game: "Sci-Fi Co-op" },
    { title: "Arcade Revival Finals", game: "Retro Arcade" },
    { title: "Battle Pass Showdown", game: "Hero Shooter" },
    { title: "Indie Spotlight Community Cup", game: "Indie Platformer" },
    { title: "Next-Gen Graphics Showcase Cup", game: "Racing Sim" },
    { title: "Aim Lab to Arena Challenge", game: "Arena FPS" },
    { title: "Weekend Console Cup #02", game: "Action RPG Arena" },
    { title: "Late Night Ranked Grind", game: "Competitive FPS" },
    { title: "Duo Strategy Invitational", game: "Auto Battler" },
    { title: "CydeHub Proving Grounds", game: "Hero Brawler" },
    { title: "Community Creator League", game: "Sandbox Survival" },
    { title: "Holiday Championship Series", game: "Sports Basketball" },
    { title: "Spring Split Open Qualifier", game: "MOBA" },
    { title: "Summer LAN Warmup Cup", game: "Tactical Shooter" },
    { title: "Autumn Knockout Bracket", game: "Fighting Arena" },
    { title: "Winter Circuit Finals", game: "Battle Royale" },
    { title: "Speedrun Relay Tournament", game: "Action Adventure" },
    { title: "No-Build Frenzy Cup", game: "Battle Royale" },
    { title: "Precision Aim Invitational", game: "Arena FPS" },
    { title: "Elite Squad Trials", game: "Tactical Shooter" },
    { title: "Cloud Gaming Community Cup", game: "Sports Football" },
    { title: "Next Patch Preview Scrim", game: "Hero Shooter" },
    { title: "Weekly Console Royale", game: "Open World Action" },
    { title: "Champion Road Finals", game: "Racing Sim" },
  ] as const;

  const seededExtras: Tournament[] = extra.map((e, idx) => ({
    id: uid("t"),
    title: e.title,
    game: e.game,
    starts_at: new Date(now.getTime() + 1000 * 60 * 60 * (96 + idx * 12)).toISOString(),
    created_by: "demo_admin",
    created_at: new Date(now.getTime() - 1000 * 60 * (45 + idx * 7)).toISOString(),
  }));

  return [...base, ...seededExtras];
}

export const demoStore = {
  getUser(): DemoUser | null {
    return safeParse<DemoUser>(localStorage.getItem(LS.user));
  },

  signIn(email: string): DemoUser {
    const user = { id: uid("usr"), email };
    localStorage.setItem(LS.user, JSON.stringify(user));
    return user;
  },

  signOut() {
    localStorage.removeItem(LS.user);
  },

  getListings(): Listing[] {
    const existing = safeParse<Listing[]>(localStorage.getItem(LS.listings));
    if (existing && existing.length > 0) return existing;
    const seeded = seedListings();
    localStorage.setItem(LS.listings, JSON.stringify(seeded));
    return seeded;
  },

  getListing(id: string): Listing | null {
    return this.getListings().find((l) => l.id === id) ?? null;
  },

  createListing(input: Omit<Listing, "id" | "created_at" | "seller_id">) {
    const user = this.getUser();
    const listings = this.getListings();
    const now = new Date().toISOString();

    const listing: Listing = {
      id: uid("lst"),
      seller_id: user?.id ?? "demo_seller",
      created_at: now,
      ...input,
    };

    const next = [listing, ...listings];
    localStorage.setItem(LS.listings, JSON.stringify(next));
    return listing;
  },

  getPosts(): BlogPost[] {
    const existing = safeParse<BlogPost[]>(localStorage.getItem(LS.posts));
    if (existing && existing.length > 0) return existing;
    const seeded = seedPosts();
    localStorage.setItem(LS.posts, JSON.stringify(seeded));
    return seeded;
  },

  getTournaments(): Tournament[] {
    const existing = safeParse<Tournament[]>(localStorage.getItem(LS.tournaments));
    const seeded = seedTournaments();

    if (existing && existing.length > 0) {
      if (existing.length >= seeded.length) return existing;

      const key = (t: Tournament) => `${t.title}__${t.game}`;
      const known = new Set(existing.map((t) => key(t)));
      const topup = seeded.filter((t) => !known.has(key(t)));
      const merged = [...existing, ...topup];
      localStorage.setItem(LS.tournaments, JSON.stringify(merged));
      return merged;
    }

    localStorage.setItem(LS.tournaments, JSON.stringify(seeded));
    return seeded;
  },

  getChatMessages(): DemoChatMessage[] {
    const existing = safeParse<DemoChatMessage[]>(localStorage.getItem(LS.chat));
    if (existing) return existing;
    const seeded: DemoChatMessage[] = [
      {
        id: uid("msg"),
        content: "Welcome to CydeHub demo chat. Configure Supabase to enable realtime.",
        created_at: new Date().toISOString(),
        sender_id: "demo_admin",
      },
    ];
    localStorage.setItem(LS.chat, JSON.stringify(seeded));
    return seeded;
  },

  addChatMessage(content: string) {
    const user = this.getUser();
    const prev = this.getChatMessages();
    const msg: DemoChatMessage = {
      id: uid("msg"),
      content,
      created_at: new Date().toISOString(),
      sender_id: user?.id ?? "demo_guest",
    };
    const next = [...prev, msg];
    localStorage.setItem(LS.chat, JSON.stringify(next));
    return msg;
  },

  getTestimonials(): DemoTestimonial[] {
    return [
      {
        quote:
          "The UI feels fast. Every action has instant feedback — it’s super intuitive.",
        name: "Demo Tester",
        title: "Buyer",
      },
      {
        quote:
          "Listing creation is clean and doesn’t waste my time. The flow just makes sense.",
        name: "Demo Seller",
        title: "Seller",
      },
      {
        quote:
          "Chat + tournaments + updates in one place is exactly what our community needs.",
        name: "Demo Organizer",
        title: "Tournament host",
      },
    ];
  },
};

export type { DemoChatMessage, DemoTestimonial, DemoUser };
