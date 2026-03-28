import type { AggregatedTournamentPost } from "@/lib/models";

type FeedSource = {
  name: string;
  url: string;
};

const FEED_SOURCES: FeedSource[] = [
  { name: "Liquipedia News", url: "https://liquipedia.net/feed/news" },
  { name: "Esports Insider", url: "https://esportsinsider.com/feed/" },
  { name: "Dexerto Esports", url: "https://www.dexerto.com/esports/feed/" },
  { name: "Dot Esports", url: "https://dotesports.com/feed" },
  { name: "HLTV", url: "https://www.hltv.org/rss/news" },
  { name: "VLR", url: "https://www.vlr.gg/rss/news.xml" },
  { name: "Riot Games", url: "https://www.riotgames.com/en/rss" },
  { name: "PlayStation Blog", url: "https://blog.playstation.com/feed/" },
  { name: "Xbox Wire", url: "https://news.xbox.com/en-us/feed/" },
];

const CACHE_WINDOW_MS = 1000 * 60 * 10;
let cache: { at: number; posts: AggregatedTournamentPost[] } | null = null;

const TOURNAMENT_KEYWORDS = [
  "tournament",
  "championship",
  "open",
  "qualifier",
  "final",
  "league",
  "cup",
  "major",
  "masters",
  "invitational",
  "esports",
  "bracket",
  "playoffs",
  "showdown",
  "clash",
  "split",
  "series",
];

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code: string) => {
      const n = Number.parseInt(code, 10);
      return Number.isFinite(n) ? String.fromCharCode(n) : "";
    });
}

function stripHtml(input: string): string {
  return decodeHtmlEntities(input)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function readTag(xmlChunk: string, tags: string[]): string {
  for (const tag of tags) {
    const escaped = tag.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
    const re = new RegExp(`<${escaped}[^>]*>([\\s\\S]*?)<\\/${escaped}>`, "i");
    const match = xmlChunk.match(re);
    if (match?.[1]) {
      return match[1].trim();
    }
  }
  return "";
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

function stableId(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function guessGame(title: string, text: string): string {
  const combined = `${title} ${text}`.toLowerCase();

  if (combined.includes("valorant")) return "Valorant";
  if (combined.includes("counter-strike") || combined.includes("cs2") || combined.includes("cs:go")) {
    return "Counter-Strike";
  }
  if (combined.includes("league of legends") || combined.includes("lck") || combined.includes("lcs")) {
    return "League of Legends";
  }
  if (combined.includes("dota")) return "Dota 2";
  if (combined.includes("fortnite")) return "Fortnite";
  if (combined.includes("rocket league")) return "Rocket League";
  if (combined.includes("fifa") || combined.includes("fc 24") || combined.includes("ea sports fc")) {
    return "EA Sports FC";
  }
  if (combined.includes("call of duty") || combined.includes("warzone")) return "Call of Duty";
  if (combined.includes("apex")) return "Apex Legends";
  if (combined.includes("overwatch")) return "Overwatch";
  if (combined.includes("rainbow six") || combined.includes("siege")) return "Rainbow Six Siege";
  if (combined.includes("tekken") || combined.includes("street fighter") || combined.includes("mortal kombat")) {
    return "Fighting Games";
  }

  return "Esports";
}

function isTournamentLike(title: string, content: string): boolean {
  const text = `${title} ${content}`.toLowerCase();
  return TOURNAMENT_KEYWORDS.some((k) => text.includes(k));
}

function parseFeedXml(xml: string, source: FeedSource): AggregatedTournamentPost[] {
  const itemMatches = [...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)].map((m) => m[0]);

  return itemMatches
    .map((item) => {
      const titleRaw = readTag(item, ["title"]);
      const linkRaw = readTag(item, ["link"]);
      const contentRaw = readTag(item, ["content:encoded", "description"]);
      const excerptRaw = readTag(item, ["description", "content:encoded"]);
      const pubDateRaw = readTag(item, ["pubDate", "published", "dc:date"]);

      const title = stripHtml(titleRaw);
      const sourceUrl = stripHtml(linkRaw);
      const story = stripHtml(contentRaw);
      const summary = stripHtml(excerptRaw).slice(0, 220);

      if (!title || !sourceUrl || !story) return null;
      if (!isTournamentLike(title, story)) return null;

      const published = new Date(stripHtml(pubDateRaw));
      const startsAt = Number.isNaN(published.getTime())
        ? new Date().toISOString()
        : published.toISOString();

      const slugBase = slugify(title) || "tournament";
      const slug = `${slugBase}-${stableId(sourceUrl)}`;

      return {
        id: `ext_t_${stableId(sourceUrl)}`,
        slug,
        title,
        game: guessGame(title, story),
        summary,
        story,
        source: source.name,
        source_url: sourceUrl,
        starts_at: startsAt,
      } satisfies AggregatedTournamentPost;
    })
    .filter((post): post is AggregatedTournamentPost => Boolean(post));
}

async function fetchSingleFeed(source: FeedSource): Promise<AggregatedTournamentPost[]> {
  try {
    const res = await fetch(source.url, {
      headers: {
        "User-Agent": "CydeHub/1.0 (+https://cydehub.vercel.app)",
      },
      next: { revalidate: 900 },
    });

    if (!res.ok) return [];

    const xml = await res.text();
    return parseFeedXml(xml, source);
  } catch {
    return [];
  }
}

export async function getAggregatedTournamentPosts(limit = 80): Promise<AggregatedTournamentPost[]> {
  if (cache && Date.now() - cache.at < CACHE_WINDOW_MS) {
    return cache.posts.slice(0, limit);
  }

  const all = await Promise.all(FEED_SOURCES.map((source) => fetchSingleFeed(source)));

  const byUrl = new Map<string, AggregatedTournamentPost>();
  for (const list of all) {
    for (const post of list) {
      if (!byUrl.has(post.source_url)) {
        byUrl.set(post.source_url, post);
      }
    }
  }

  const posts = [...byUrl.values()].sort(
    (a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime(),
  );

  cache = { at: Date.now(), posts };
  return posts.slice(0, limit);
}

export async function getAggregatedTournamentPostBySlug(
  slug: string,
): Promise<AggregatedTournamentPost | null> {
  const posts = await getAggregatedTournamentPosts(160);
  return posts.find((p) => p.slug === slug) ?? null;
}
