"use client";

import Link from "next/link";
import JournalGrid from "./JournalGrid";
import { LangProvider, type Lang } from "@/lib/life-i18n";
import type { LifePost } from "@/lib/life";

type Category = {
  id: string;
  name: string;
  nameZh: string;
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
    <LangProvider>
      {(lang, setLang) => {
        const zh = lang === "zh";
        const line = [
          zh ? `${stats.total} 次` : `${stats.total} bakes`,
          `${stats.from} — ${stats.to}`,
          ...stats.kinds.map(([kind, n]) =>
            zh ? `${kind} ${n}` : `${kind === "中式" ? "Chinese" : "Western"} ${n}`
          ),
        ];

        return (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                {/* 标题本身就是面包屑：Life 点回总览，后半截是当前这页 */}
                <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Link href="/life" className="text-gray-400 hover:text-primary transition-colors">
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

              <div className="flex-shrink-0 flex text-sm border border-gray-300 rounded-full overflow-hidden">
                {(["en", "zh"] as Lang[]).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLang(l)}
                    aria-pressed={lang === l}
                    className={`px-3 py-1 transition-colors ${
                      lang === l
                        ? "bg-primary text-white"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    {l === "en" ? "EN" : "中"}
                  </button>
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
