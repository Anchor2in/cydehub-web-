export type ListingCategory =
  | "console_game"
  | "subscription"
  | "digital_account"
  | "coaching"
  | "tournament_entry";

export type Listing = {
  id: string;
  title: string;
  description: string;
  category: ListingCategory;
  price_cents: number;
  currency: string;
  seller_id: string;
  created_at: string;
};

export type BlogPost = {
  id: string;
  title: string;
  content: string;
  author_id: string;
  created_at: string;
};

export type AggregatedBlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  story: string;
  source: string;
  source_url: string;
  image_url: string | null;
  created_at: string;
};

export type Tournament = {
  id: string;
  title: string;
  game: string;
  starts_at: string;
  created_by: string;
  created_at: string;
};

export type AggregatedTournamentPost = {
  id: string;
  slug: string;
  title: string;
  game: string;
  summary: string;
  story: string;
  source: string;
  source_url: string;
  starts_at: string;
};

export type AggregatedMarketplaceCategory =
  | "game"
  | "console"
  | "account"
  | "gift_card"
  | "coupon"
  | "other";

export type AggregatedMarketplaceItem = {
  id: string;
  title: string;
  description: string;
  category: AggregatedMarketplaceCategory;
  price_cents: number;
  currency: string;
  source: string;
  source_url: string;
  image_url: string | null;
  created_at: string;
};
