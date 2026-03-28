import Link from "next/link";
import { notFound } from "next/navigation";
import { getAggregatedBlogPostBySlug } from "@/lib/blog/aggregate";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function BlogStoryPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getAggregatedBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

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

        <div className="mt-6 whitespace-pre-wrap leading-7 text-white/80">{post.story}</div>

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
