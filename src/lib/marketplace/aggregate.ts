import type { AggregatedMarketplaceCategory, AggregatedMarketplaceItem } from "@/lib/models";

type SourcePage = {
  source: string;
  url: string;
};

const SOURCE_PAGES: SourcePage[] = [
  { source: "Z2U", url: "https://www.z2u.com/" },
  { source: "Z2U", url: "https://www.z2u.com/game" },
  { source: "Z2U", url: "https://www.z2u.com/gift-card" },
  { source: "Avechi", url: "https://avechi.co.ke/" },
  { source: "Avechi", url: "https://avechi.co.ke/product-category/gaming/" },
  { source: "Avechi", url: "https://avechi.co.ke/product-category/gaming-consoles/" },
];

const FALLBACK_ITEMS: Omit<AggregatedMarketplaceItem, "id" | "created_at">[] = [
  {
    title: "EA Sports FC 25 Coins - PS5",
    description: "Instant delivery marketplace offer for FC coins and digital trade support.",
    category: "game",
    price_cents: 1599,
    currency: "USD",
    source: "Z2U",
    source_url: "https://www.z2u.com/game",
    image_url: null,
  },
  {
    title: "Valorant Account - Competitive Rank",
    description: "Ranked-ready account listing with in-game inventory and secure handover.",
    category: "account",
    price_cents: 3299,
    currency: "USD",
    source: "Z2U",
    source_url: "https://www.z2u.com/",
    image_url: null,
  },
  {
    title: "PlayStation 5 Console Bundle",
    description: "Current generation console bundle from a trusted electronics storefront.",
    category: "console",
    price_cents: 69900,
    currency: "KES",
    source: "Avechi",
    source_url: "https://avechi.co.ke/product-category/gaming-consoles/",
    image_url: null,
  },
  {
    title: "Xbox Series X Console",
    description: "High-performance Xbox console option sourced from Avechi catalog pages.",
    category: "console",
    price_cents: 85000,
    currency: "KES",
    source: "Avechi",
    source_url: "https://avechi.co.ke/product-category/gaming-consoles/",
    image_url: null,
  },
  {
    title: "PlayStation Store Gift Card",
    description: "Top-up card listing for wallet funding and digital purchases.",
    category: "gift_card",
    price_cents: 2500,
    currency: "USD",
    source: "Z2U",
    source_url: "https://www.z2u.com/gift-card",
    image_url: null,
  },
  {
    title: "Steam Wallet Gift Card",
    description: "Popular gaming gift card for Steam balance top-ups.",
    category: "gift_card",
    price_cents: 2000,
    currency: "USD",
    source: "Z2U",
    source_url: "https://www.z2u.com/gift-card",
    image_url: null,
  },
  {
    title: "Gaming Access Coupon Bundle",
    description: "Promo coupon bundle for digital game-related purchases and subscriptions.",
    category: "coupon",
    price_cents: 799,
    currency: "USD",
    source: "Z2U",
    source_url: "https://www.z2u.com/",
    image_url: null,
  },
  {
    title: "Console Accessories Discount Coupon",
    description: "Coupon option for console and accessory shopping on supported stores.",
    category: "coupon",
    price_cents: 499,
    currency: "USD",
    source: "Avechi",
    source_url: "https://avechi.co.ke/",
    image_url: null,
  },
];

const CACHE_WINDOW_MS = 1000 * 60 * 10;
let cache: { at: number; items: AggregatedMarketplaceItem[] } | null = null;

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
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stableId(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function normalizeUrl(rawUrl: string, baseUrl: string): string {
  try {
    return new URL(rawUrl, baseUrl).toString();
  } catch {
    return rawUrl;
  }
}

function guessCurrency(text: string): string {
  const value = text.toLowerCase();
  if (value.includes("kes") || value.includes("ksh")) return "KES";
  if (value.includes("usd") || value.includes("$")) return "USD";
  if (value.includes("eur") || value.includes("€")) return "EUR";
  if (value.includes("gbp") || value.includes("£")) return "GBP";
  return "USD";
}

function parsePriceCents(text: string): number | null {
  const cleaned = text.replace(/,/g, "");
  const match = cleaned.match(/(\d+(?:\.\d{1,2})?)/);
  if (!match?.[1]) return null;
  const amount = Number.parseFloat(match[1]);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return Math.round(amount * 100);
}

function guessCategory(text: string): AggregatedMarketplaceCategory {
  const value = text.toLowerCase();
  if (value.includes("gift") && value.includes("card")) return "gift_card";
  if (value.includes("coupon") || value.includes("voucher") || value.includes("promo code")) {
    return "coupon";
  }
  if (
    value.includes("console") ||
    value.includes("playstation") ||
    value.includes("ps5") ||
    value.includes("xbox") ||
    value.includes("nintendo")
  ) {
    return "console";
  }
  if (value.includes("account") || value.includes("profile")) return "account";
  if (
    value.includes("game") ||
    value.includes("coins") ||
    value.includes("top up") ||
    value.includes("top-up") ||
    value.includes("skin") ||
    value.includes("battle pass")
  ) {
    return "game";
  }
  return "other";
}

function parseProductJsonLd(html: string, baseUrl: string, source: string): AggregatedMarketplaceItem[] {
  const scripts = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map(
    (m) => m[1],
  );

  const out: AggregatedMarketplaceItem[] = [];

  for (const script of scripts) {
    try {
      const parsed = JSON.parse(script.trim()) as unknown;
      const nodes = Array.isArray(parsed)
        ? parsed
        : typeof parsed === "object" && parsed !== null && "@graph" in parsed
          ? ((parsed as { "@graph"?: unknown })["@graph"] ?? [])
          : [parsed];

      if (!Array.isArray(nodes)) continue;

      for (const node of nodes) {
        if (!node || typeof node !== "object") continue;
        const n = node as {
          "@type"?: string | string[];
          name?: string;
          description?: string;
          url?: string;
          image?: string | string[];
          offers?: { price?: string | number; priceCurrency?: string } | Array<{ price?: string | number; priceCurrency?: string }>;
        };

        const types = Array.isArray(n["@type"]) ? n["@type"] : [n["@type"]];
        if (!types.some((t) => typeof t === "string" && t.toLowerCase() === "product")) continue;

        const title = stripHtml(n.name ?? "");
        if (!title) continue;

        const description = stripHtml(n.description ?? "").slice(0, 280) || `${title} from ${source}.`;
        const sourceUrl = normalizeUrl(n.url ?? baseUrl, baseUrl);
        const image = Array.isArray(n.image) ? n.image[0] : n.image;
        const imageUrl = image ? normalizeUrl(image, baseUrl) : null;

        const offer = Array.isArray(n.offers) ? n.offers[0] : n.offers;
        const priceText = `${offer?.price ?? ""}`;
        const cents = parsePriceCents(priceText);
        if (!cents) continue;

        const currency = (offer?.priceCurrency?.toUpperCase() || guessCurrency(priceText)).slice(0, 3);
        const category = guessCategory(`${title} ${description}`);

        out.push({
          id: `ext_m_${stableId(sourceUrl)}`,
          title,
          description,
          category,
          price_cents: cents,
          currency,
          source,
          source_url: sourceUrl,
          image_url: imageUrl,
          created_at: new Date().toISOString(),
        });
      }
    } catch {
      continue;
    }
  }

  return out;
}

function parseHtmlCards(html: string, baseUrl: string, source: string): AggregatedMarketplaceItem[] {
  const cardMatches = [...html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]{100,2200}?)<\/a>/gi)].map((m) => ({
    href: m[1],
    body: m[2],
  }));

  const out: AggregatedMarketplaceItem[] = [];

  for (const card of cardMatches) {
    const cardText = stripHtml(card.body);
    if (!cardText || cardText.length < 18) continue;

    const priceMatch = cardText.match(/(?:USD|KES|KSH|\$|€|£)\s?\d[\d,.]*(?:\.\d{1,2})?|\d[\d,.]*(?:\.\d{1,2})?\s?(?:USD|KES|KSH|€|£)/i);
    if (!priceMatch?.[0]) continue;

    const title = cardText.split(" ").slice(0, 10).join(" ").trim();
    const cents = parsePriceCents(priceMatch[0]);
    if (!title || !cents) continue;

    const imgMatch = card.body.match(/<img[^>]+src=["']([^"']+)["']/i);
    const sourceUrl = normalizeUrl(card.href, baseUrl);

    out.push({
      id: `ext_m_${stableId(sourceUrl)}`,
      title,
      description: cardText.slice(0, 240),
      category: guessCategory(cardText),
      price_cents: cents,
      currency: guessCurrency(priceMatch[0]),
      source,
      source_url: sourceUrl,
      image_url: imgMatch?.[1] ? normalizeUrl(imgMatch[1], baseUrl) : null,
      created_at: new Date().toISOString(),
    });
  }

  return out;
}

async function fetchSourcePage(page: SourcePage): Promise<AggregatedMarketplaceItem[]> {
  try {
    const res = await fetch(page.url, {
      headers: {
        "User-Agent": "CydeHub/1.0 (+https://cydehub.vercel.app)",
      },
      next: { revalidate: 900 },
    });

    if (!res.ok) return [];
    const html = await res.text();

    const jsonLd = parseProductJsonLd(html, page.url, page.source);
    const htmlCards = parseHtmlCards(html, page.url, page.source);
    return [...jsonLd, ...htmlCards];
  } catch {
    return [];
  }
}

function toFallbackItem(item: Omit<AggregatedMarketplaceItem, "id" | "created_at">): AggregatedMarketplaceItem {
  const id = `ext_m_${stableId(`${item.source}_${item.title}_${item.source_url}`)}`;
  return {
    ...item,
    id,
    created_at: new Date().toISOString(),
  };
}

function ensureRequiredCategories(items: AggregatedMarketplaceItem[]): AggregatedMarketplaceItem[] {
  const required: AggregatedMarketplaceCategory[] = ["game", "console", "account", "gift_card", "coupon"];
  const existing = new Set(items.map((item) => item.category));
  const out = [...items];

  for (const category of required) {
    if (existing.has(category)) continue;
    const fallback = FALLBACK_ITEMS.find((item) => item.category === category);
    if (!fallback) continue;
    out.push(toFallbackItem(fallback));
    existing.add(category);
  }

  for (const fallback of FALLBACK_ITEMS) {
    const id = `ext_m_${stableId(`${fallback.source}_${fallback.title}_${fallback.source_url}`)}`;
    if (!out.some((item) => item.id === id)) {
      out.push(toFallbackItem(fallback));
    }
  }

  return out;
}

export async function getAggregatedMarketplaceItems(limit = 120): Promise<AggregatedMarketplaceItem[]> {
  if (cache && Date.now() - cache.at < CACHE_WINDOW_MS) {
    return cache.items.slice(0, limit);
  }

  const all = await Promise.all(SOURCE_PAGES.map((source) => fetchSourcePage(source)));
  const merged = new Map<string, AggregatedMarketplaceItem>();

  for (const list of all) {
    for (const item of list) {
      if (!merged.has(item.id)) {
        merged.set(item.id, item);
      }
    }
  }

  const withFallbacks = ensureRequiredCategories([...merged.values()]);
  const items = withFallbacks
    .filter((item) => item.title.length >= 4 && item.price_cents > 0)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  cache = { at: Date.now(), items };
  return items.slice(0, limit);
}
