# Life 板块 + 多页化 Implementation Plan (v2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** 按 spec（`docs/superpowers/specs/2026-08-09-life-page-multipage-design.md`）实现 /life 生活板块（hub → 板块页 → 详情页，markdown 驱动）、/publications 完整列表页、主页代表作精选与导航改造。

**Architecture:** Next.js 15 App Router + `output: 'export'`（GitHub Pages 静态导出）。生活内容为 `content/life/<category>/<slug>.md`，构建期由 `lib/life.ts`（fs + gray-matter）读取，`generateStaticParams` 枚举全部路由。板块清单在 `config/site.ts` 的 `lifeCategories`。

**Tech Stack:** Next.js 15.1 / React 19 / Tailwind / react-markdown（已有）/ gray-matter + remark-gfm（新增）。

> **v2 说明：** 本计划第一次执行到 Task 4 时本地目录被清空，工作丢失。v2 把当时代码审查发现的全部缺陷直接写进了代码（见下方 ⚠️ 标记），因此不应重复出现。

**验证方式:** 仓库无单测框架（内容型站点，不引入——YAGNI）。每任务用 `npx tsc --noEmit` + `npm run build` + 检查导出 HTML 验证，最后用 headless Chrome 截图人工核对。

**分支策略:** 在 `life-feature` 分支上工作，**每个任务完成后立刻 push 到远端**（防丢失）。全部完成并人工核对后再合并回 `homepage-v2` 触发部署。

---

### Task 1: 依赖 + 数据模型

**Files:** Modify `package.json`（via npm install）, Modify `config/site.ts`

- [ ] **Step 1: 装依赖**

Run: `npm install gray-matter remark-gfm`

- [ ] **Step 2: 接口**

`config/site.ts` 的 `publications` 条目类型，`venue: string;` 之后加：

```ts
    selected?: boolean;  // 主页代表作标记
```

`SiteConfig` 接口中 `service` 字段之前加：

```ts
  // 生活板块（/life 下的子板块，每个板块一个内容目录）
  lifeCategories: Array<{
    id: string;  // 目录名 & URL 段，如 "baking"
    name: string;  // 显示名，如 "Baking 烘焙"
    emoji: string;
    description: string;  // 一句话简介
    cover: string;  // hub 卡片封面图
  }>;
```

- [ ] **Step 3: 数据**

`siteConfig` 对象中 `service:` 之前加：

```ts
  // ============================================================
  // 生活板块 - 新增板块 = 这里加一行 + content/life/<id>/ 建目录
  // ============================================================
  lifeCategories: [
    {
      id: "baking",
      name: "Baking 烘焙",
      emoji: "🧁",
      description: "Cakes, breads, and sweet experiments from my kitchen.",
      cover: "/life/baking/cover.svg",
    },
    {
      id: "knitting",
      name: "Knitting 编织",
      emoji: "🧶",
      description: "Handmade sweaters, scarves, and yarn projects.",
      cover: "/life/knitting/cover.svg",
    },
  ],
```

- [ ] **Step 4: 标记代表作**

给这 6 篇加 `selected: true`（加在 `year` 之后）：`pub-2024-vaid`、`pub-2025-constructive`、`pub-2024-live`、`pub-2023-metaglyph`、`pub-2022-glyphcreator`、`pub-2023-notable`。不要给其他论文加。

- [ ] **Step 5: 验证 + 提交**

Run: `npx tsc --noEmit`（期望无输出）

```bash
git add package.json package-lock.json config/site.ts
git commit -m "Add lifeCategories config and selected-publication flags"
git push origin life-feature
```

---

### Task 2: 内容脚手架

**Files:** Create `content/life/baking/first-bake.md`, `content/life/knitting/first-knit.md`, `public/life/baking/cover.svg`, `public/life/knitting/cover.svg`

- [ ] **Step 1: 示例文章**

`content/life/baking/first-bake.md`:

```markdown
---
title: 我的第一篇烘焙记录
date: 2026-08-09
cover: /life/baking/cover.svg
---

这是一篇示例配方，替换成你的作品吧！

## 用料

- 淡奶油 200g
- 奶油奶酪 250g
- 鸡蛋 3 个

## 步骤

1. 预热烤箱 220°C。
2. 所有材料搅拌至顺滑。
3. 烤 25 分钟，中心微颤即可出炉。

## 小贴士

冷藏过夜风味更佳。
```

`content/life/knitting/first-knit.md`:

```markdown
---
title: 我的第一篇编织记录
date: 2026-08-09
cover: /life/knitting/cover.svg
---

这是一篇示例记录，替换成你的作品吧！

## 用线

- 美丽诺羊毛 4 团

## 心得

起针 88 针，平针织到 40cm 收针。
```

注意：frontmatter 里**没有** `category` 键——分类由目录决定。

- [ ] **Step 2: 封面占位 SVG**

`public/life/baking/cover.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#fdf1e7"/><text x="200" y="170" font-size="96" text-anchor="middle">🧁</text></svg>
```

`public/life/knitting/cover.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#eef4ea"/><text x="200" y="170" font-size="96" text-anchor="middle">🧶</text></svg>
```

- [ ] **Step 3: 提交**

```bash
git add content/ public/life/
git commit -m "Add sample life content and placeholder covers"
git push origin life-feature
```

---

### Task 3: 内容读取层 lib/life.ts

**Files:** Create `lib/life.ts`

⚠️ 以下代码已包含 v1 审查发现的三处修正：日期格式校验、错误消息带文件路径、同日排序稳定。**不要退回到更简单的版本。**

- [ ] **Step 1: 实现**

```ts
import fs from "fs";
import path from "path";
import matter from "gray-matter";

const CONTENT_DIR = path.join(process.cwd(), "content", "life");

export interface LifePost {
  slug: string;
  category: string;
  title: string;
  date: string; // YYYY-MM-DD
  cover?: string;
  content: string; // markdown 正文
}

// YAML 会把不带引号的 2026-08-09 解析成 Date，这里统一成字符串。
// 格式不对就直接抛错——作者写错日期时要立刻构建失败，而不是静默产出错误页面。
function normalizeDate(value: unknown): string {
  const normalized =
    value instanceof Date ? value.toISOString().slice(0, 10) : value ? String(value) : "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new Error(`invalid date ${JSON.stringify(value)}, expected YYYY-MM-DD`);
  }
  return normalized;
}

function readPost(category: string, slug: string): LifePost {
  const filePath = path.join(CONTENT_DIR, category, `${slug}.md`);
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(raw);
    return {
      slug,
      category,
      title: data.title ?? slug,
      date: normalizeDate(data.date),
      cover: data.cover,
      content,
    };
  } catch (err) {
    // 带上文件路径，否则 YAML 报错时不知道是哪篇出问题
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`${filePath}: ${message}`);
  }
}

/** 某板块全部文章，按日期倒序；同日按 slug 升序保证稳定。目录不存在时返回 []。 */
export function getPostsByCategory(category: string): LifePost[] {
  const dir = path.join(CONTENT_DIR, category);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => readPost(category, f.replace(/\.md$/, "")))
    .sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1;
      return a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0;
    });
}

/** 单篇文章；不存在返回 null。 */
export function getPost(category: string, slug: string): LifePost | null {
  const file = path.join(CONTENT_DIR, category, `${slug}.md`);
  if (!fs.existsSync(file)) return null;
  return readPost(category, slug);
}
```

- [ ] **Step 2: 验证**

Run: `npx tsc --noEmit`（期望无输出）

- [ ] **Step 3: 提交**

```bash
git add lib/life.ts
git commit -m "Add life content loader (fs + gray-matter)"
git push origin life-feature
```

---

### Task 4: Life 三级页面

**Files:** Create `app/life/page.tsx`, `app/life/[category]/page.tsx`, `app/life/[category]/[slug]/page.tsx`

Next 15 中动态路由 `params` 是 Promise，页面组件与 `generateMetadata` 都用 `async` + `await params`。

- [ ] **Step 1: hub 页 `app/life/page.tsx`**

```tsx
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/layout/Header";
import { siteConfig } from "@/config/site";
import { getPostsByCategory } from "@/lib/life";

export const metadata = { title: "Life - Lu Ying" };

export default function LifePage() {
  const { lifeCategories } = siteConfig;
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <span>🌿</span>
          <span>Life</span>
        </h1>
        <p className="text-gray-600 mb-8">Things I make and love outside research.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {lifeCategories.map((cat) => {
            const count = getPostsByCategory(cat.id).length;
            return (
              <Link
                key={cat.id}
                href={`/life/${cat.id}`}
                className="group block border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="relative h-44 bg-gray-50">
                  <Image
                    src={cat.cover}
                    alt={cat.name}
                    fill
                    sizes="(max-width: 640px) 100vw, 50vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {cat.emoji} {cat.name}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">{cat.description}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {count} {count === 1 ? "post" : "posts"}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: 板块列表页 `app/life/[category]/page.tsx`**

```tsx
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import { siteConfig } from "@/config/site";
import { getPostsByCategory } from "@/lib/life";

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
      <main className="max-w-5xl mx-auto px-6 py-10">
        <Link href="/life" className="text-sm text-gray-500 hover:text-primary">
          ← Life
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2 mb-1">
          {cat.emoji} {cat.name}
        </h1>
        <p className="text-gray-600 mb-8">{cat.description}</p>

        {posts.length === 0 ? (
          <p className="text-gray-500 py-12 text-center">Nothing here yet — check back soon!</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/life/${category}/${post.slug}`}
                className="group block border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="relative h-40 bg-gray-50">
                  {post.cover && (
                    <Image
                      src={post.cover}
                      alt={post.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                </div>
                <div className="p-4">
                  <h2 className="text-base font-semibold text-gray-900 group-hover:text-primary transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">{post.date}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
```

- [ ] **Step 3: 详情页 `app/life/[category]/[slug]/page.tsx`**

⚠️ **两个必须保留的关键点**（v1 实测踩过）：
1. react-markdown v10 会把内部 `node` 属性传给每个自定义组件，直接 `{...props}` 到原生标签会在导出的 HTML 里产生 `node="[object Object]"`。**每个 override 都必须 `({ node, ...props })` 把它解构掉。**
2. `img` override 里 `{...props}` 必须在 `alt=` **之前**，否则 spread 会覆盖 alt 兜底。

```tsx
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

// 正文标题从 h2 起：页面本身的 h1 已经是文章标题，
// 作者在正文里写 # 时也映射到 h2 样式，避免出现第二个 h1。
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
    <th className="border border-gray-200 px-3 py-2 text-left font-semibold text-gray-900" {...props} />
  ),
  td: ({ node, ...props }: any) => (
    <td className="border border-gray-200 px-3 py-2 text-gray-700" {...props} />
  ),
  hr: ({ node, ...props }: any) => <hr className="my-8 border-gray-200" {...props} />,
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
        <Link href={`/life/${category}`} className="text-sm text-gray-500 hover:text-primary">
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
```

- [ ] **Step 4: 构建验证**

Run: `npm run build`

期望路由含：`/life`、`/life/baking`、`/life/knitting`、`/life/baking/first-bake`、`/life/knitting/first-knit`。

然后检查导出 HTML：
- `grep -c 'node="' out/life/baking/first-bake.html` 必须是 **0**
- 各页 `<title>` 互不相同（hub / 板块 / 文章 / 主页）
- 临时在 `first-bake.md` 末尾追加代码块、引用、GFM 表格、`---`、`# 标题`，重新构建，确认各自带上样式类且 `# 标题` 渲染为 `<h2>` 而非第二个 `<h1>`；**验证后务必还原内容文件**

- [ ] **Step 5: 提交**

```bash
git add app/life/
git commit -m "Add /life hub, category, and post detail pages"
git push origin life-feature
```

---

### Task 5: /publications 页

**Files:** Modify `components/sections/PublicationList.tsx`, Create `app/publications/page.tsx`

- [ ] **Step 1: PublicationList 加可选 prop**

把组件签名从：

```tsx
export default function PublicationList() {
  const { publications } = siteConfig;
```

改为：

```tsx
export default function PublicationList({
  publications: pubsProp,
}: {
  publications?: typeof siteConfig.publications;
}) {
  const publications = pubsProp ?? siteConfig.publications;
```

其余不变（组件内部已统一用 `publications` 变量）。

- [ ] **Step 2: 新建 `app/publications/page.tsx`**

```tsx
import Header from "@/components/layout/Header";
import PublicationList from "@/components/sections/PublicationList";

export const metadata = {
  title: "Publications - Lu Ying",
  description: "Full list of publications by Lu Ying.",
};

export default function PublicationsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-2">
          <span>📑</span>
          <span>Publications</span>
        </h1>
        <PublicationList />
      </main>
    </div>
  );
}
```

- [ ] **Step 3: 验证 + 提交**

Run: `npx tsc --noEmit`

```bash
git add components/sections/PublicationList.tsx app/publications/
git commit -m "Add /publications page; PublicationList accepts a subset"
git push origin life-feature
```

---

### Task 6: 主页代表作

**Files:** Modify `app/page.tsx`

- [ ] **Step 1: 改 Publications 区**

顶部加 import：

```tsx
import Link from "next/link";
import { siteConfig } from "@/config/site";
```

Publications section 改为：

```tsx
            {/* Publications Section (selected only) */}
            <section id="publications" className="scroll-mt-20">
              <h1 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-2">
                <span>📑</span>
                <span>Selected Publications</span>
              </h1>
              <PublicationList
                publications={siteConfig.publications.filter((p) => p.selected)}
              />
              <div className="mt-6 text-right">
                <Link href="/publications" className="text-primary font-medium hover:underline">
                  View all publications →
                </Link>
              </div>
            </section>
```

- [ ] **Step 2: 验证 + 提交**

Run: `npx tsc --noEmit`

```bash
git add app/page.tsx
git commit -m "Home shows selected publications with link to full list"
git push origin life-feature
```

---

### Task 7: Header 导航改造

**Files:** Modify `config/site.ts`（navigation）, Modify `components/layout/Header.tsx`

- [ ] **Step 1: navigation 配置**

```ts
  navigation: [
    { name: "About", href: "#about" },
    { name: "Publications", href: "/publications" },
    { name: "CV", href: "#cv" },
    { name: "Awards", href: "#awards" },
    { name: "Service", href: "#service" },
    { name: "Life", href: "/life" },
  ],
```

- [ ] **Step 2: Header 区分两类链接**

imports 加：

```tsx
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
```

组件内开头加：

```tsx
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/";
```

滚动监听 effect 首行改为（只统计锚点项，且仅主页生效）：

```tsx
      if (!isHome) return;
      const sections = navigation
        .filter((item) => item.href.startsWith("#"))
        .map((item) => item.href.replace("#", ""));
```

依赖数组改为 `[navigation, isHome]`。

`handleClick` 改为：

```tsx
  const handleClick = (
    e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>,
    href: string
  ) => {
    e.preventDefault();
    if (!isHome) {
      router.push(`/${href}`); // 其他页面：跳回主页对应锚点
      setMobileMenuOpen(false);
      return;
    }
    const targetId = href.replace("#", "");
    const element = document.getElementById(targetId);
    if (element) {
      window.scrollTo({ top: element.offsetTop - 80, behavior: "smooth" });
      setMobileMenuOpen(false);
    }
  };
```

桌面导航渲染改为（移动端菜单同样逻辑，沿用其原有 className）：

```tsx
          {navigation.map((item) => {
            const isPageLink = item.href.startsWith("/");
            const isActive = isPageLink
              ? pathname.startsWith(item.href)
              : isHome && activeSection === item.href.replace("#", "");
            const cls = `text-base transition-colors ${
              isActive
                ? "text-primary font-bold"
                : "text-gray-700 hover:text-primary font-medium"
            }`;
            return isPageLink ? (
              <Link key={item.name} href={item.href} className={cls}>
                {item.name}
              </Link>
            ) : (
              <a
                key={item.name}
                href={item.href}
                onClick={(e) => handleClick(e, item.href)}
                className={cls}
                style={{ cursor: "pointer" }}
              >
                {item.name}
              </a>
            );
          })}
```

站名/logo 按钮 onClick 保持 `handleClick(e, "#about")`（非主页时自动跳 `/#about`）。

- [ ] **Step 3: 验证 + 提交**

Run: `npm run build`（期望成功，全部路由静态生成）

```bash
git add config/site.ts components/layout/Header.tsx
git commit -m "Header supports page links and cross-page anchors; add Life nav"
git push origin life-feature
```

---

### Task 8: 终验

- [ ] **Step 1: 全量构建**

Run: `npm run build`

导出路由须含：`/`、`/publications`、`/life`、`/life/baking`、`/life/knitting`、`/life/baking/first-bake`、`/life/knitting/first-knit`。

- [ ] **Step 2: headless 截图核对**

清单：
- 主页 Publications 区：仅 6 篇代表作 + "View all publications →"
- `/publications`：全部论文按年分组
- `/life`：两张板块卡片 + 计数
- `/life/baking`：示例文章卡片
- `/life/baking/first-bake`：markdown 正文渲染正常
- 从 `/life` 点 About：跳回主页 about 锚点
- 390px 宽：各页不破版

- [ ] **Step 3: 用户过目截图，确认后合并部署**

```bash
git checkout homepage-v2
git merge life-feature
git push origin homepage-v2
```
