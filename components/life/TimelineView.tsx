"use client";

import Image from "next/image";
import { useMemo } from "react";
import type { LifePost } from "@/lib/life";

// 每张照片歪一点，循环使用，避免一排全是端端正正的
const TILT = [-2.2, 1.8, -1.2, 2.4, -1.6, 1.3];

function monthIndex(month: string) {
  const [y, m] = month.split("-").map(Number);
  return y * 12 + m;
}

/**
 * 竖着读的时间线：有作品的月份才占一行，那个月做的都摆在右边。
 * 没做的月份不留空行，收成一小段虚线写上歇了多久——空白于是成了一句话，
 * 而不是一片没内容的地方。这也是日历视图里最难看的那部分的解法。
 */
export default function TimelineView({
  posts,
  newestFirst,
  onOpen,
}: {
  posts: LifePost[];
  newestFirst: boolean;
  onOpen: (post: LifePost) => void;
}) {
  const months = useMemo(() => {
    const by = new Map<string, LifePost[]>();
    // 组内始终从早到晚，一个月里的顺序跟着做的先后走
    [...posts]
      .sort((a, b) => (a.date < b.date ? -1 : 1))
      .forEach((p) => {
        const m = p.date.slice(0, 7);
        by.set(m, [...(by.get(m) ?? []), p]);
      });
    const keys = [...by.keys()].sort();
    if (newestFirst) keys.reverse();
    return keys.map((m) => ({ month: m, list: by.get(m)! }));
  }, [posts, newestFirst]);

  if (months.length === 0) return null;

  return (
    <div className="journal-paper rounded-lg px-5 py-6 sm:px-7 sm:py-8">
      {months.map(({ month, list }, i) => {
        // 跟上一行之间隔了几个没做的月份
        const prev = months[i - 1];
        const gap = prev
          ? Math.abs(monthIndex(month) - monthIndex(prev.month)) - 1
          : 0;
        return (
          <div key={month}>
            {gap > 0 && (
              <div className="flex gap-4">
                <div className="w-[86px] flex-shrink-0" />
                <div className="w-px border-l border-dashed border-[#d8c48f] min-h-[34px]" />
                <span className="journal-hand text-sm text-[#b0a077] self-center">
                  歇了 {gap} 个月
                </span>
              </div>
            )}

            <div className="flex gap-4 items-start py-2.5">
              <div className="w-[86px] flex-shrink-0 text-right pt-1.5">
                <b className="journal-hand block text-lg font-normal text-[#7a5f3a]">
                  {Number(month.slice(5))} 月
                </b>
                <span className="journal-hand text-sm text-[#a2916f]">
                  {month.slice(0, 4)}　{list.length} 次
                </span>
              </div>

              {/* 串起整条时间线的那根线，行首点一个结 */}
              <div className="w-px self-stretch bg-[#ddcfa6] relative flex-shrink-0">
                <span className="absolute -left-[3px] top-3.5 w-[7px] h-[7px] rounded-full bg-[#c0a86c]" />
              </div>

              <div className="flex flex-wrap gap-2.5 pb-1">
                {list.map((post, k) => (
                  <button
                    key={post.slug}
                    type="button"
                    onClick={() => onOpen(post)}
                    title={`${post.date}　${post.title}`}
                    className="bg-white rounded-[2px] p-1.5 pb-5 shadow-[0_3px_10px_rgba(90,70,40,0.24)] transition-transform duration-200 hover:scale-[1.12] hover:rotate-0 hover:z-10 relative"
                    style={{ transform: `rotate(${TILT[k % TILT.length]}deg)` }}
                  >
                    <Image
                      src={post.square ?? post.cover ?? ""}
                      alt={post.title}
                      width={700}
                      height={700}
                      sizes="84px"
                      className="block w-[76px] h-[76px] sm:w-[84px] sm:h-[84px] object-cover bg-gray-100"
                    />
                    <span className="journal-hand absolute inset-x-0 bottom-0.5 text-xs text-[#8a7355] truncate px-1">
                      {post.title}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
