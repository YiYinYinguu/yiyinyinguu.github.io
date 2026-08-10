"use client";

import { useMemo } from "react";
import type { LifePost } from "@/lib/life";

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const INK = "#9a6b3f";

/**
 * 年 × 月的格子：深浅是那个月做了几次，空月留着不填。
 * 列表按时间倒着排，看不出哪几年密哪几年荒，也看不出每年二月那一列特别深。
 * 点格子就只看那个月，再点一下取消。
 */
export default function MonthGrid({
  posts,
  selected,
  onSelect,
}: {
  posts: LifePost[];
  selected: string;
  onSelect: (month: string) => void;
}) {
  const { years, count, most } = useMemo(() => {
    const count = new Map<string, number>();
    posts.forEach((p) => count.set(p.date.slice(0, 7), (count.get(p.date.slice(0, 7)) ?? 0) + 1));
    const ys = posts.map((p) => Number(p.date.slice(0, 4)));
    const from = Math.min(...ys);
    const years = Array.from({ length: Math.max(...ys) - from + 1 }, (_, i) => from + i);
    return { years, count, most: Math.max(...count.values()) };
  }, [posts]);

  if (posts.length === 0) return null;

  return (
    <div className="text-[11px] text-gray-400 select-none">
      <div className="flex gap-[3px] ml-[38px] mb-1">
        {MONTHS.map((m) => (
          <span key={m} className="w-5 text-center">
            {m}
          </span>
        ))}
      </div>
      {years.map((year) => (
        <div key={year} className="flex items-center gap-[3px] mb-[3px]">
          <span className="w-[35px] tabular-nums">{year}</span>
          {MONTHS.map((m) => {
            const key = `${year}-${String(m).padStart(2, "0")}`;
            const n = count.get(key) ?? 0;
            const on = selected === key;
            return (
              <button
                key={m}
                type="button"
                disabled={!n}
                onClick={() => onSelect(on ? "" : key)}
                title={n ? `${year} 年 ${m} 月 · ${n} 次` : undefined}
                aria-label={`${year} 年 ${m} 月，${n} 次`}
                aria-pressed={on}
                className={`w-5 h-5 rounded-[3px] transition-all ${
                  n ? "cursor-pointer hover:ring-2 hover:ring-[#c9b68a]" : "cursor-default"
                } ${on ? "ring-2 ring-[#9a6b3f]" : ""}`}
                style={{
                  // 空月留个淡淡的底，格子结构才看得出来
                  background: n
                    ? `color-mix(in srgb, ${INK} ${18 + (n / most) * 72}%, transparent)`
                    : "#f2efe8",
                }}
              />
            );
          })}
        </div>
      ))}
      <p className="mt-2 ml-[38px]">
        {selected ? (
          <button
            type="button"
            onClick={() => onSelect("")}
            className="text-[#9a6b3f] hover:underline"
          >
            只看 {selected.slice(0, 4)} 年 {Number(selected.slice(5))} 月 · {count.get(selected)} 次，点这里看全部
          </button>
        ) : (
          "深浅 = 当月做了几次，点格子只看那个月"
        )}
      </p>
    </div>
  );
}
