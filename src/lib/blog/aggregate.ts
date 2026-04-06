import type { AggregatedBlogPost } from "@/lib/models";

type FeedSource = {
  name: string;
  url: string;
};

const FEED_SOURCES: FeedSource[] = [
  { name: "Xbox Wire", url: "https://news.xbox.com/en-us/feed/" },
  { name: "PlayStation Blog", url: "https://blog.playstation.com/feed/" },
  { name: "Microsoft Blogs", url: "https://blogs.microsoft.com/feed/" },
  { name: "EA News", url: "https://www.ea.com/news/rss" },
  { name: "NVIDIA Blog", url: "https://blogs.nvidia.com/feed/" },
  { name: "Unreal Engine", url: "https://www.unrealengine.com/en-US/feed/blog" },
];

const CACHE_WINDOW_MS = 1000 * 60 * 10;
let cache: { at: number; posts: AggregatedBlogPost[] } | null = null;

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

function readLink(xmlChunk: string): string {
  const hrefMatch = xmlChunk.match(/<link\b[^>]*\bhref=["']([^"']+)["'][^>]*\/?>/i);
  if (hrefMatch?.[1]) {
    return hrefMatch[1].trim();
  }

  return readTag(xmlChunk, ["link"]);
}

function readMediaUrl(xmlChunk: string): string | null {
  const mediaTagMatch = xmlChunk.match(/<(media:content|media:thumbnail)\b[^>]*>/i)?.[0] ?? "";
  const mediaUrl = mediaTagMatch.match(/\burl=["']([^"']+)["']/i)?.[1];
  if (mediaUrl) {
    return mediaUrl;
  }

  const enclosureTag = xmlChunk.match(/<enclosure\b[^>]*>/i)?.[0] ?? "";
  const enclosureType = enclosureTag.match(/\btype=["']([^"']+)["']/i)?.[1] ?? "";
  const enclosureUrl = enclosureTag.match(/\burl=["']([^"']+)["']/i)?.[1];
  if (enclosureUrl && enclosureType.toLowerCase().startsWith("image/")) {
    return enclosureUrl;
  }

  return null;
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

function parseFeedXml(xml: string, source: FeedSource): AggregatedBlogPost[] {
  const chunks = [
    ...[...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)].map((m) => m[0]),
    ...[...xml.matchAll(/<entry\b[\s\S]*?<\/entry>/gi)].map((m) => m[0]),
  ];

  return chunks
    .map((chunk) => {
      const titleRaw = readTag(chunk, ["title"]);
      const linkRaw = readLink(chunk);
      const contentRaw = readTag(chunk, ["content:encoded", "content", "description", "summary"]);
      const excerptRaw = readTag(chunk, ["summary", "description", "content:encoded", "content"]);
      const pubDateRaw = readTag(chunk, ["pubDate", "published", "updated", "dc:date"]);

      const title = stripHtml(titleRaw);
      const sourceUrl = stripHtml(linkRaw);
      const story = stripHtml(contentRaw);
      const excerpt = stripHtml(excerptRaw).slice(0, 220);
      const published = new Date(stripHtml(pubDateRaw));
      const imageUrl = readMediaUrl(chunk);

      if (!title || !sourceUrl || (!story && !excerpt)) return null;

      const finalStory = story || excerpt;

      const slugBase = slugify(title) || "post";
      const slug = `${slugBase}-${stableId(sourceUrl)}`;

      return {
        id: `ext_${stableId(sourceUrl)}`,
        slug,
        title,
        excerpt: excerpt || finalStory.slice(0, 220),
        story: finalStory,
        source: source.name,
        source_url: sourceUrl,
        image_url: imageUrl,
        created_at: Number.isNaN(published.getTime())
          ? new Date().toISOString()
          : published.toISOString(),
      } satisfies AggregatedBlogPost;
    })
    .filter((post): post is AggregatedBlogPost => Boolean(post));
}

async function fetchSingleFeed(source: FeedSource): Promise<AggregatedBlogPost[]> {
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

export async function getAggregatedBlogPosts(limit = 60): Promise<AggregatedBlogPost[]> {
  if (cache && Date.now() - cache.at < CACHE_WINDOW_MS) {
    return cache.posts.slice(0, limit);
  }

  const all = await Promise.all(FEED_SOURCES.map((source) => fetchSingleFeed(source)));

  const byUrl = new Map<string, AggregatedBlogPost>();
  for (const list of all) {
    for (const post of list) {
      if (!byUrl.has(post.source_url)) {
        byUrl.set(post.source_url, post);
      }
    }
  }

  const posts = [...byUrl.values()].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  cache = { at: Date.now(), posts };
  return posts.slice(0, limit);
}

export async function getAggregatedBlogPostBySlug(
  slug: string,
): Promise<AggregatedBlogPost | null> {
  const posts = await getAggregatedBlogPosts(120);
  return posts.find((p) => p.slug === slug) ?? null;
}
