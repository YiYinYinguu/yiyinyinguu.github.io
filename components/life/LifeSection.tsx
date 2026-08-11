"use client";

import Link from "next/link";
import JournalGrid from "./JournalGrid";
import { LangProvider, type Lang, type Unit } from "@/lib/life-i18n";
import type { LifePost } from "@/lib/life";

// 跟 life-i18n 里那份一致；这里是服务端拼好的统计行，用不上 hook
const KIND_EN: Record<string, string> = {
  中式: "Chinese",
  西式: "Western",
  藤编: "Rattan",
  钩针: "Crochet",
  羊毛毡: "Needle felting",
  木工: "Woodwork",
  刺绣: "Embroidery",
  手绘: "Drawing",
};

type Category = {
  id: string;
  name: string;
  nameZh: string;
  unit: Unit;
  emoji: string;
  description: string;
  descriptionZh: string;
};

/**
 * Life 板块的外壳。语言只在这里切——站里其他部分一律英文，
 * 所以没必要做成全站路由，一个开关加 localStorage 就够。
 */
export default function LifeSection({
  category,
  posts,
  stats,
}: {
  category: Category;
  posts: LifePost[];
  stats: { total: number; from: string; to: string; kinds: Array<[string, number]> };
}) {
  return (
    <LangProvider unit={category.unit}>
      {(lang, setLang) => {
        const zh = lang === "zh";
        const unit = zh ? category.unit.zh : stats.total === 1 ? category.unit.one : category.unit.many;
        const line = [
          `${stats.total} ${unit}`,
          `${stats.from} — ${stats.to}`,
          // 分类多了就只报个数，六种手艺一字排开太吵
          ...(stats.kinds.length > 3
            ? [zh ? `${stats.kinds.length} 种手艺` : `${stats.kinds.length} techniques`]
            : stats.kinds.map(([kind, n]) => `${zh ? kind : KIND_EN[kind] ?? kind} ${n}`)),
        ];

        return (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                {/* 标题本身就是面包屑：Life 点回总览，后半截是当前这页 */}
                <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Link href="/life/" className="text-gray-400 hover:text-primary transition-colors">
                    Life
                  </Link>
                  <span className="text-gray-300 font-normal">/</span>
                  <span>{category.emoji}</span>
                  <span>{zh ? category.nameZh : category.name}</span>
                </h1>
                <p className="text-base text-gray-600">
                  {zh ? category.descriptionZh : category.description}
                </p>
                {stats.total > 0 && (
                  <p className="text-sm text-gray-400 mt-1">{line.join(" · ")}</p>
                )}
              </div>

              {/* 跟标题里的 Life / Baking 同一种写法：当前的深色，另一个是链接 */}
              <div className="flex-shrink-0 text-sm pt-1">
                {(["en", "zh"] as Lang[]).map((l, i) => (
                  <span key={l}>
                    {i > 0 && <span className="mx-2 text-gray-300">/</span>}
                    <button
                      type="button"
                      onClick={() => setLang(l)}
                      aria-pressed={lang === l}
                      className={
                        lang === l
                          ? "text-gray-900"
                          : "text-gray-400 hover:text-primary transition-colors"
                      }
                    >
                      {l === "en" ? "EN" : "中文"}
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <JournalGrid posts={posts} category={category.id} />
            </div>
          </>
        );
      }}
    </LangProvider>
  );
}
