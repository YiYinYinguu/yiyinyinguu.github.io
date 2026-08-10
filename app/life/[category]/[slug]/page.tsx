import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Header from "@/components/layout/Header";
import { siteConfig } from "@/config/site";
import { getPost, getPostsByCategory } from "@/lib/life";

export function generateStaticParams() {
  return siteConfig.lifeCategories.flatMap((c) =>
    getPostsByCategory(c.id).map((p) => ({ category: c.id, slug: p.slug }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}): Promise<Metadata> {
  const { category, slug } = await params;
  const post = getPost(category, slug);
  if (!post) return {};
  const title = `${post.title} - Lu Ying`;
  return {
    title,
    openGraph: { title, images: post.cover ? [post.cover] : undefined },
  };
}

/* eslint-disable @typescript-eslint/no-explicit-any */

// react-markdown 会把内部的 node 属性传给每个自定义组件，
// 必须解构掉，否则会渲染成 node="[object Object]" 的无效 HTML 属性。
// 正文标题从 h2 起：页面本身的 h1 已经是文章标题，
// 正文里写 # 时也映射到 h2 样式，避免出现第二个 h1。
const H2 = ({ node, ...props }: any) => (
  <h2 className="text-xl font-bold mt-8 mb-3 text-gray-900" {...props} />
);

const markdownComponents = {
  h1: H2,
  h2: H2,
  h3: ({ node, ...props }: any) => (
    <h3 className="text-lg font-semibold mt-6 mb-2 text-gray-900" {...props} />
  ),
  p: ({ node, ...props }: any) => (
    <p className="text-gray-700 leading-relaxed mb-4" {...props} />
  ),
  ul: ({ node, ...props }: any) => (
    <ul className="list-disc pl-6 mb-4 space-y-1 text-gray-700" {...props} />
  ),
  ol: ({ node, ...props }: any) => (
    <ol className="list-decimal pl-6 mb-4 space-y-1 text-gray-700" {...props} />
  ),
  blockquote: ({ node, ...props }: any) => (
    <blockquote
      className="border-l-4 border-primary/40 bg-gray-50 pl-4 py-2 mb-4 text-gray-600 italic"
      {...props}
    />
  ),
  pre: ({ node, ...props }: any) => (
    <pre
      className="bg-gray-900 text-gray-100 rounded-lg p-4 mb-4 overflow-x-auto text-sm [&>code]:bg-transparent [&>code]:text-inherit [&>code]:p-0"
      {...props}
    />
  ),
  code: ({ node, ...props }: any) => (
    <code className="bg-gray-100 text-primary rounded px-1.5 py-0.5 text-sm" {...props} />
  ),
  table: ({ node, ...props }: any) => (
    <div className="overflow-x-auto mb-4">
      <table className="min-w-full text-sm border border-gray-200" {...props} />
    </div>
  ),
  thead: ({ node, ...props }: any) => <thead className="bg-gray-50" {...props} />,
  th: ({ node, ...props }: any) => (
    <th
      className="border border-gray-200 px-3 py-2 text-left font-semibold text-gray-900"
      {...props}
    />
  ),
  td: ({ node, ...props }: any) => (
    <td className="border border-gray-200 px-3 py-2 text-gray-700" {...props} />
  ),
  hr: ({ node, ...props }: any) => <hr className="my-8 border-gray-200" {...props} />,
  // alt 兜底必须放在 spread 之后，否则会被 props 里的 undefined 覆盖
  // eslint-disable-next-line @next/next/no-img-element
  img: ({ node, ...props }: any) => (
    <img className="rounded-lg my-6 max-w-full" {...props} alt={props.alt ?? ""} />
  ),
  a: ({ node, ...props }: any) => <a className="text-primary hover:underline" {...props} />,
};

export default async function LifePostPage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;
  const cat = siteConfig.lifeCategories.find((c) => c.id === category);
  const post = getPost(category, slug);
  if (!cat || !post) notFound();

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="max-w-3xl mx-auto px-6 py-10">
        <Link href={`/life/${category}/`} className="text-sm text-gray-500 hover:text-primary">
          ← {cat.name}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2 mb-1">{post.title}</h1>
        <p className="text-sm text-gray-400 mb-6">
          {cat.emoji} {post.date}
        </p>
        {post.cover && (
          <div className="relative w-full h-72 mb-8 rounded-xl overflow-hidden bg-gray-50">
            <Image
              src={post.cover}
              alt={post.title}
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
            />
          </div>
        )}
        <article>
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {post.content}
          </ReactMarkdown>
        </article>
      </main>
    </div>
  );
}
