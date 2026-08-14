"use client";

import Image from "next/image";
import { useMemo } from "react";
import type { LifePost } from "@/lib/life";
import { editorialCover } from "@/lib/life-editorial";
import { useCount, useGapLabel, useLang, useTitle } from "@/lib/life-i18n";

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
  editorialCategory,
  inks,
  onOpen,
}: {
  posts: LifePost[];
  newestFirst: boolean;
  editorialCategory?: string;
  inks?: ReadonlyMap<string, string>;
  onOpen: (post: LifePost) => void;
}) {
  const lang = useLang();
  const dishName = useTitle();
  const times = useCount();
  const editorial = Boolean(editorialCategory);
  const squareEditorial = editorialCategory === "craft";
  // 只写月份，年份单独起一行分段
  const MONTH_EN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const monthOnly = (m: string) =>
    lang === "zh" ? `${Number(m.slice(5))} 月` : MONTH_EN[Number(m.slice(5)) - 1];
  const gapLabel = useGapLabel();
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
    <div className="journal-paper rounded-lg px-3 py-5 sm:px-7 sm:py-8">
      {months.map(({ month, list }, i) => {
        // 跟上一行之间隔了几个没做的月份
        const prev = months[i - 1];
        const gap = prev
          ? Math.abs(monthIndex(month) - monthIndex(prev.month)) - 1
          : 0;
        const newYear = !prev || prev.month.slice(0, 4) !== month.slice(0, 4);
        return (
          <div key={month}>
            {newYear && (
              <div className="flex items-center gap-2 pt-6 pb-1 first:pt-0 sm:gap-4">
                <div className="w-[58px] flex-shrink-0 text-right sm:w-[86px]">
                  <span className="journal-hand text-2xl text-[#7a5f3a]">
                    {month.slice(0, 4)}
                  </span>
                </div>
                <div className="flex-1 border-t border-[#ddcfa6]" />
              </div>
            )}
            {gap > 0 && (
              <div className="flex gap-2 sm:gap-4">
                <div className="w-[58px] flex-shrink-0 sm:w-[86px]" />
                <div className="w-px border-l border-dashed border-[#d8c48f] min-h-[34px]" />
                <span className="journal-hand text-sm font-medium text-[#9a8a63] self-center">
                  {gapLabel(gap)}
                </span>
              </div>
            )}

            <div className="flex gap-2 items-start py-2.5 sm:gap-4">
              <div className="w-[58px] flex-shrink-0 text-right pt-1.5 sm:w-[86px]">
                <b className="journal-hand block text-xl font-normal text-[#7a5f3a]">
                  {monthOnly(month)}
                </b>
                <span className="journal-hand text-base text-[#a2916f]">
                  {times(list.length)}
                </span>
              </div>

              {/* 串起整条时间线的那根线，行首点一个结 */}
              <div className="w-px self-stretch bg-[#ddcfa6] relative flex-shrink-0">
                <span className="absolute -left-[3px] top-3.5 w-[7px] h-[7px] rounded-full bg-[#c0a86c]" />
              </div>

              <div className={`flex flex-wrap pb-1 ${editorial ? "gap-5 sm:gap-7" : "gap-3.5"}`}>
                {list.map((post, k) => {
                  const ink = inks?.get(post.title) ?? "#8a7355";
                  return (
                    <button
                    key={post.slug}
                    type="button"
                    onClick={() => onOpen(post)}
                    title={`${post.date}　${dishName(post)}`}
                    className={`bg-white rounded-[2px] p-2 shadow-[0_3px_10px_rgba(90,70,40,0.24)] transition-transform duration-200 hover:scale-[1.08] hover:rotate-0 hover:z-10 relative ${
                      editorial ? "pb-2" : "pb-7"
                    }`}
                    style={{ transform: `rotate(${TILT[k % TILT.length]}deg)` }}
                  >
                    <Image
                      src={
                        editorialCategory
                          ? editorialCover(editorialCategory, post.slug)
                          : post.square ?? post.cover ?? ""
                      }
                      alt={dishName(post)}
                      width={editorial ? 1024 : 700}
                      height={editorial ? (squareEditorial ? 1024 : 1536) : 700}
                      sizes={editorial ? "200px" : "168px"}
                      className={`block object-cover bg-gray-100 ${
                        editorial
                          ? `${
                              squareEditorial ? "aspect-square" : "aspect-[2/3]"
                            } w-[128px] min-[390px]:w-[150px] sm:w-[180px] lg:w-[200px]`
                          : "w-[112px] h-[112px] min-[390px]:w-[130px] min-[390px]:h-[130px] sm:w-[168px] sm:h-[168px]"
                      }`}
                    />
                    {editorial ? (
                      <span className="journal-hand flex min-h-[68px] flex-col px-1 pt-2.5 text-left">
                        <span>
                          <span
                            className="inline rounded-[2px] px-1.5 py-0.5 text-xs leading-[1.45] text-white box-decoration-clone sm:text-sm"
                            style={{
                              background: `color-mix(in srgb, ${ink} 40%, transparent)`,
                            }}
                          >
                            #{dishName(post)}
                          </span>
                        </span>
                        <span
                          className="mt-auto self-end pt-1.5 text-[10px] opacity-70"
                          style={{ color: ink }}
                        >
                          {post.date.replace(/-/g, ".")}
                        </span>
                      </span>
                    ) : (
                      <span className="journal-hand absolute inset-x-0 bottom-1 text-sm text-[#8a7355] truncate px-2">
                        {dishName(post)}
                      </span>
                    )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
