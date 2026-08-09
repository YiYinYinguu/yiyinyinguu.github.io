import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import JournalGrid from "@/components/life/JournalGrid";
import { siteConfig } from "@/config/site";
import { getPostsByCategory, type LifePost } from "@/lib/life";

export function generateStaticParams() {
  return siteConfig.lifeCategories.map((c) => ({ category: c.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const cat = siteConfig.lifeCategories.find((c) => c.id === category);
  if (!cat) return {};
  const title = `${cat.name} - Lu Ying`;
  return {
    title,
    description: cat.description,
    openGraph: { title, description: cat.description, images: [cat.cover] },
  };
}

/** 标题下面那行小字：做了多少次、从什么时候到什么时候、各类多少。 */
function summarize(posts: LifePost[]): string[] {
  if (posts.length === 0) return [];
  const dates = posts.map((p) => p.date).sort();
  const month = (d: string) => d.slice(0, 7).replace("-", ".");
  const counts = new Map<string, number>();
  posts.forEach((p) => p.kind && counts.set(p.kind, (counts.get(p.kind) ?? 0) + 1));

  return [
    `${posts.length} 次`,
    `${month(dates[0])} — ${month(dates[dates.length - 1])}`,
    ...[...counts].sort().map(([kind, n]) => `${kind} ${n}`),
  ];
}

export default async function LifeCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const cat = siteConfig.lifeCategories.find((c) => c.id === category);
  if (!cat) notFound();
  const posts = getPostsByCategory(category);
  const stats = summarize(posts);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* 标题本身就是面包屑：Life 点回总览，后半截是当前这页 */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Link href="/life" className="text-gray-400 hover:text-primary transition-colors">
            Life
          </Link>
          <span className="text-gray-300 font-normal">/</span>
          <span>{cat.emoji}</span>
          <span>{cat.name}</span>
        </h1>
        <p className="text-base text-gray-600">{cat.description}</p>
        {stats.length > 0 && <p className="text-sm text-gray-400 mt-1">{stats.join(" · ")}</p>}

        {/* 筛选、排序和弹窗都要交互，交给客户端组件；内容还是构建时读好的 */}
        <div className="mt-6">
          <JournalGrid posts={posts} category={category} />
        </div>
      </main>
    </div>
  );
}
