import fs from "fs";
import path from "path";
import matter from "gray-matter";

const CONTENT_DIR = path.join(process.cwd(), "content", "life");

export interface LifePost {
  slug: string;
  category: string;
  title: string;
  titleEn?: string; // 英文模式下显示的菜名
  date: string; // YYYY-MM-DD
  kind?: string; // 中式 / 西式，用来筛选
  cover?: string;
  square?: string; // 手账卡片用的 1:1 方图；没有就退回 cover
  note?: string; // 手账上的一两句心得，用 | 换行
  recipes: Recipe[]; // 参考的食谱，一道菜可能试过好几个方子
  photos: string[]; // 封面在前，正文里的图跟在后面
  content: string; // markdown 正文
}

export interface Recipe {
  name: string;
  url: string;
  /** 「低粉 50g」这样一条条的用料。做法不收——那是作者写的正文，看原方子去。 */
  ingredients: string[];
  ingredientsEn: string[];
}

// 没记链接的方子退回下厨房搜索，搜菜谱全名基本第一条就是它
const SEARCH = "https://www.xiachufang.com/search/?keyword=";

/**
 * recipe 可以写一个，也可以写成列表；每条要么是「菜谱名 · 作者」，
 * 要么是带 url 的对象。统一成 {name, url}。
 */
function toRecipes(value: unknown): Recipe[] {
  const items = Array.isArray(value) ? value : value ? [value] : [];
  return items.map((item) => {
    if (item && typeof item === "object") {
      const { name, url, ingredients, ingredients_en } = item as {
        name?: string;
        url?: string;
        ingredients?: unknown;
        ingredients_en?: unknown;
      };
      const title = String(name ?? "");
      return {
        name: title,
        url: url || SEARCH + encodeURIComponent(title),
        ingredients: Array.isArray(ingredients) ? ingredients.map(String) : [],
        ingredientsEn: Array.isArray(ingredients_en) ? ingredients_en.map(String) : [],
      };
    }
    const name = String(item);
    // 搜索时把作者去掉，「菜谱名 · 作者」整串搜不到
    return {
      name,
      url: SEARCH + encodeURIComponent(name.split(" · ")[0]),
      ingredients: [],
      ingredientsEn: [],
    };
  });
}

/** 正文里的 ![](...) 就是这篇的其余照片，弹窗要按顺序翻。 */
function collectPhotos(cover: string | undefined, content: string): string[] {
  const inBody = [...content.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)].map((m) => m[1]);
  return (cover ? [cover, ...inBody] : inBody).filter((p, i, all) => all.indexOf(p) === i);
}

// YAML 会把不带引号的 2026-08-09 解析成 Date，这里统一成字符串。
// 格式不对就直接抛错——写错日期时要立刻构建失败，而不是静默产出错误页面。
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
      titleEn: data.title_en,
      date: normalizeDate(data.date),
      kind: data.kind,
      cover: data.cover,
      square: data.square,
      note: data.note,
      recipes: toRecipes(data.recipe),
      photos: collectPhotos(data.cover, content),
      content,
    };
  } catch (err) {
    // 带上文件路径，否则报错时不知道是哪篇出问题
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
