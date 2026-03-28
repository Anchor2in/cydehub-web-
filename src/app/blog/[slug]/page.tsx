import Link from "next/link";
import { notFound } from "next/navigation";
import { getAggregatedBlogPostBySlug } from "@/lib/blog/aggregate";

type PageProps = {
  params: Promise<{ slug: string }>;
};

function toReadableParagraphs(story: string): string[] {
  const cleaned = story.replace(/\s+/g, " ").trim();
  if (!cleaned) return [];

  const explicitParagraphs = story
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  if (explicitParagraphs.length > 1) {
    return explicitParagraphs;
  }

  const sentences = cleaned
    .split(/(?<=[.!?])\s+(?=[A-Z"])|(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length <= 3) {
    return [cleaned];
  }

  const grouped: string[] = [];
  for (let i = 0; i < sentences.length; i += 3) {
    grouped.push(sentences.slice(i, i + 3).join(" "));
  }

  return grouped;
}

export default async function BlogStoryPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getAggregatedBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const paragraphs = toReadableParagraphs(post.story);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <div className="mb-6">
        <Link
          href="/blog"
          className="text-sm font-medium text-[color:var(--cyber)] hover:underline"
        >
          ← Back to blog
        </Link>
      </div>

      <article className="animated-sheen rounded-3xl border border-white/10 bg-black/40 p-7 shadow-cyber-soft">
        <div className="inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70">
          {post.source}
        </div>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">{post.title}</h1>

        <div className="mt-3 text-xs text-white/50">{new Date(post.created_at).toLocaleString()}</div>

        <div className="mt-6 space-y-4 leading-7 text-white/80">
          {(paragraphs.length > 0 ? paragraphs : [post.story]).map((paragraph, idx) => (
            <p key={`${post.id}-p-${idx}`}>{paragraph}</p>
          ))}
        </div>

        <div className="mt-8 border-t border-white/10 pt-5">
          <a
            href={post.source_url}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium text-[color:var(--cyber)] hover:underline"
          >
            Read original source
          </a>
        </div>
      </article>
    </div>
  );
}
