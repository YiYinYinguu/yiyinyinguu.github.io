import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import LifeSection from "@/components/life/LifeSection";
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

/** 标题下面那行小字的数据；文案在客户端按语言拼。 */
function summarize(posts: LifePost[]) {
  const dates = posts.map((p) => p.date).sort();
  const month = (d: string) => d.slice(0, 7).replace("-", ".");
  const counts = new Map<string, number>();
  posts.forEach((p) => p.kind && counts.set(p.kind, (counts.get(p.kind) ?? 0) + 1));
  return {
    total: posts.length,
    from: posts.length ? month(dates[0]) : "",
    to: posts.length ? month(dates[dates.length - 1]) : "",
    kinds: [...counts].sort(),
  };
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

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="px-4 py-8 sm:py-10">
        <div className="max-w-6xl mx-auto">
          {/* 语言、筛选、弹窗都要交互，整块交给客户端；内容还是构建时读好的 */}
          <LifeSection category={cat} posts={posts} stats={summarize(posts)} />
        </div>
      </main>
    </div>
  );
}
