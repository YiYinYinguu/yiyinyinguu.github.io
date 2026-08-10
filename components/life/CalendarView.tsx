"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LifePost } from "@/lib/life";

const WEEK = ["一", "二", "三", "四", "五", "六", "日"];
const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
// 捏合累积到这个量才跳一级。macOS 每个捏合事件的 deltaY 只有个位数，
// 门槛设高了要捏很久才动一下。
const STEP = 36;

function key(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

/** 周一当作一周的头一天：JS 的 getDay() 里周日是 0，挪成 6。 */
function weekdayIndex(date: Date) {
  return (date.getDay() + 6) % 7;
}

/** 某月的格子序列：前面按星期补空，再排 1..N 号。 */
function monthCells(year: number, month: number): (number | null)[] {
  const lead = weekdayIndex(new Date(year, month - 1, 1));
  const days = new Date(year, month, 0).getDate();
  return [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
}

/**
 * 日历视图，三级语义缩放：全部年份 → 一年十二个月 → 单月。
 * 触控板双指捏合（浏览器把它报成 ctrl+wheel）进出，落点是鼠标底下那一格；
 * 点格子也能进，右上角还有一对按钮，三条路都通。
 */
export default function CalendarView({
  posts,
  onOpen,
}: {
  posts: LifePost[];
  onOpen: (post: LifePost) => void;
}) {
  const [level, setLevel] = useState(0);
  const [at, setAt] = useState({ year: 0, month: 1 });
  // 鼠标底下是哪一格，捏合放大时以它为落点
  const hover = useRef<{ year: number; month: number; post?: LifePost }>({ year: 0, month: 1 });
  const wheel = useRef(0);
  const box = useRef<HTMLDivElement>(null);
  // 缩出去之后要能一眼找回刚才在看的那一格
  const focused = useRef<HTMLElement | null>(null);

  const { years, byMonth, byDay, filled } = useMemo(() => {
    const byMonth = new Map<string, LifePost[]>();
    const byDay = new Map<string, LifePost[]>();
    // 传进来是最新在前，日历里从早到晚读更顺
    [...posts].reverse().forEach((p) => {
      const m = p.date.slice(0, 7);
      byMonth.set(m, [...(byMonth.get(m) ?? []), p]);
      byDay.set(p.date, [...(byDay.get(p.date) ?? []), p]);
    });
    const ys = posts.map((p) => Number(p.date.slice(0, 4)));
    const from = Math.min(...ys);
    return {
      years: Array.from({ length: Math.max(...ys) - from + 1 }, (_, i) => from + i),
      byMonth,
      byDay,
      // 上一月 / 下一月只在有作品的月份之间跳，空月翻过去没意义
      filled: [...byMonth.keys()].sort(),
    };
  }, [posts]);

  const zoom = useCallback(
    (dir: 1 | -1) => {
      setLevel((cur) => {
        // 已经在单月里了，再往里就是那天的作品本身
        if (cur === 2 && dir === 1) {
          if (hover.current.post) onOpen(hover.current.post);
          return cur;
        }
        const next = Math.min(2, Math.max(0, cur + dir));
        if (next > cur) setAt({ year: hover.current.year, month: hover.current.month });
        return next;
      });
    },
    [onOpen]
  );

  // 位置记在地址栏里：#cal / #cal=2021 / #cal=2021-02。
  // 缩到某个月之后点开一篇、回退、刷新，回来还在那个月，不用重新找。
  useEffect(() => {
    const m = /^#cal(?:=(\d{4})(?:-(\d{2}))?)?$/.exec(location.hash);
    if (!m) return;
    if (m[2]) {
      setAt({ year: Number(m[1]), month: Number(m[2]) });
      setLevel(2);
    } else if (m[1]) {
      setAt({ year: Number(m[1]), month: 1 });
      setLevel(1);
    }
  }, []);

  useEffect(() => {
    const tail =
      level === 2 ? `=${key(at.year, at.month)}` : level === 1 ? `=${at.year}` : "";
    history.replaceState(null, "", `${location.pathname}#cal${tail}`);
  }, [level, at]);

  useEffect(() => {
    focused.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [level]);

  // 捏合缩放。ctrl+wheel 是浏览器给触控板捏合的信号，普通滚动照常翻页面。
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      // 换方向就清零，不然反向捏要先把上一次的量抵消掉
      if (wheel.current * e.deltaY < 0) wheel.current = 0;
      wheel.current += e.deltaY;
      if (Math.abs(wheel.current) < STEP) return;
      zoom(wheel.current < 0 ? 1 : -1);
      wheel.current = 0;
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoom]);

  if (posts.length === 0) return null;

  const year = at.year || years[years.length - 1];

  /** 一个月的日子格。big 决定是年视图里的小格还是单月的大格。 */
  const Days = ({ y, m, big }: { y: number; m: number; big: boolean }) => (
    <div className={`grid grid-cols-7 ${big ? "gap-1.5 sm:gap-2" : "gap-[2px]"}`}>
      {big &&
        WEEK.map((w) => (
          <div key={w} className="journal-hand text-sm text-[#a2916f] text-center pb-1">
            {w}
          </div>
        ))}
      {monthCells(y, m).map((day, i) => {
        const date = day ? `${key(y, m)}-${String(day).padStart(2, "0")}` : "";
        const made = day ? byDay.get(date) ?? [] : [];
        return (
          <div
            key={i}
            onMouseEnter={() =>
              big && (hover.current = { year: y, month: m, post: made[0] })
            }
            className={`relative aspect-square ${
              day
                ? big
                  ? "border border-[#e0d3a8] rounded-[3px]"
                  : "bg-[#efe6c8] rounded-[1px]"
                : ""
            }`}
          >
            {big && day && (
              <span
                className={`absolute left-1 top-0.5 z-10 journal-hand text-xs ${
                  made.length ? "bg-white/80 rounded-[2px] px-1 text-[#7a5f3a]" : "text-[#b5a37e]"
                }`}
              >
                {day}
              </span>
            )}
            {made.length > 0 && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onOpen(made[0]);
                }}
                title={`${date} ${made.map((p) => p.title).join("、")}`}
                className={`absolute cursor-pointer group ${big ? "inset-[3px]" : "inset-0"}`}
              >
                <Image
                  src={made[0].square ?? made[0].cover ?? ""}
                  alt={made[0].title}
                  width={700}
                  height={700}
                  sizes={big ? "120px" : "24px"}
                  className={`w-full h-full object-cover ${
                    big
                      ? "rounded-[2px] shadow-[0_1px_4px_rgba(90,70,40,0.3)] transition-transform duration-200 group-hover:scale-[1.06]"
                      : "rounded-[1px]"
                  }`}
                />
                {big && made.length > 1 && (
                  <span className="absolute right-0.5 bottom-0.5 bg-white/85 rounded-[2px] px-1 text-[10px] text-[#7a5f3a]">
                    +{made.length - 1}
                  </span>
                )}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div ref={box} className="journal-paper rounded-lg p-5 sm:p-7">
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <nav className="text-sm text-gray-500">
          <button
            type="button"
            onClick={() => setLevel(0)}
            className={level ? "hover:text-primary" : "text-gray-400"}
          >
            全部年份
          </button>
          {level > 0 && (
            <>
              <span className="mx-1.5 text-gray-300">/</span>
              <button
                type="button"
                onClick={() => setLevel(1)}
                className={level > 1 ? "hover:text-primary" : "text-gray-400"}
              >
                {year}
              </button>
            </>
          )}
          {level > 1 && (
            <>
              <span className="mx-1.5 text-gray-300">/</span>
              <span className="text-gray-400">{at.month} 月</span>
            </>
          )}
        </nav>

        <span className="text-xs text-gray-400 ml-auto">
          {level < 2 ? "双指捏合缩放，或点格子" : "捏合停在某天可以直接打开那篇"}
        </span>
        <span className="flex gap-1">
          <button
            type="button"
            onClick={() => zoom(-1)}
            disabled={level === 0}
            aria-label="缩小"
            className="w-6 h-6 rounded border border-[#ded3b6] text-[#7d6a4a] disabled:opacity-35 hover:bg-white"
          >
            −
          </button>
          <button
            type="button"
            onClick={() => zoom(1)}
            aria-label="放大"
            className="w-6 h-6 rounded border border-[#ded3b6] text-[#7d6a4a] disabled:opacity-35 hover:bg-white"
          >
            ＋
          </button>
        </span>
      </div>

      {level === 0 && (
        <div className="journal-zoom">
          <div className="flex gap-1 mb-1 ml-[42px] text-[13px] text-[#a2916f]">
            {MONTHS.map((m) => (
              <span key={m} className="flex-1 text-center">
                {m}
              </span>
            ))}
          </div>
          {years.map((y) => (
            <div key={y} className="flex items-center gap-1 mb-1">
              <span className="w-[38px] text-[13px] text-[#a2916f] tabular-nums">{y}</span>
              {MONTHS.map((m) => {
                const list = byMonth.get(key(y, m)) ?? [];
                const cover = list[0]?.square ?? list[0]?.cover;
                return (
                  <button
                    key={m}
                    type="button"
                    disabled={!list.length}
                    onMouseEnter={() => (hover.current = { year: y, month: m })}
                    onClick={() => {
                      setAt({ year: y, month: m });
                      setLevel(1);
                    }}
                    title={list.length ? `${y} 年 ${m} 月 · ${list.length} 次` : undefined}
                    aria-label={`${y} 年 ${m} 月，${list.length} 次`}
                    ref={(el) => {
                      if (y === at.year && m === at.month) focused.current = el;
                    }}
                    className={`relative flex-1 aspect-square rounded-[2px] overflow-hidden ${
                      list.length
                        ? "shadow-[0_1px_3px_rgba(90,70,40,0.25)] hover:scale-110 transition-transform"
                        : "border border-[#e6dcc0]"
                    } ${
                      y === at.year && m === at.month
                        ? "ring-2 ring-[#9a6b3f] ring-offset-1 ring-offset-[#fdf5da]"
                        : ""
                    }`}
                  >
                    {cover && (
                      <Image
                        src={cover}
                        alt=""
                        width={700}
                        height={700}
                        sizes="48px"
                        className="w-full h-full object-cover"
                      />
                    )}
                    {list.length > 1 && (
                      <span className="absolute right-0 bottom-0 bg-white/85 px-[3px] text-[11px] leading-[1.4] text-[#7a5f3a]">
                        {list.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {level === 1 && (
        <div className="journal-zoom grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {MONTHS.map((m) => {
            const n = (byMonth.get(key(year, m)) ?? []).length;
            return (
              <div
                key={m}
                onMouseEnter={() => (hover.current = { year, month: m })}
                onClick={() => {
                  if (!n) return;
                  setAt({ year, month: m });
                  setLevel(2);
                }}
                ref={(el) => {
                  if (m === at.month) focused.current = el;
                }}
                className={`rounded-[3px] p-1.5 transition-colors ${
                  n ? "cursor-pointer hover:bg-white/50" : "opacity-45"
                } ${m === at.month ? "bg-white/60 ring-1 ring-[#d9c79a]" : ""}`}
              >
                <div className="journal-hand text-base text-[#7a5f3a] mb-1">
                  {m} 月{n > 0 && <span className="text-[#a2916f] text-sm ml-1.5">{n} 次</span>}
                </div>
                <Days y={year} m={m} big={false} />
              </div>
            );
          })}
        </div>
      )}

      {level === 2 && (
        <div className="journal-zoom max-w-3xl mx-auto">
          <div className="flex items-baseline gap-3 mb-3">
            <Step filled={filled} at={at} setAt={setAt} dir={-1} />
            <div className="journal-hand text-2xl text-[#7a5f3a]">
              {year} 年 {at.month} 月
              <span className="text-base text-[#a2916f] ml-2">
                {(byMonth.get(key(year, at.month)) ?? []).length} 次
              </span>
            </div>
            <Step filled={filled} at={at} setAt={setAt} dir={1} />
          </div>
          <Days y={year} m={at.month} big />
        </div>
      )}
    </div>
  );
}

/** 单月视图里的上一月 / 下一月，只在有作品的月份之间走。 */
function Step({
  filled,
  at,
  setAt,
  dir,
}: {
  filled: string[];
  at: { year: number; month: number };
  setAt: (v: { year: number; month: number }) => void;
  dir: 1 | -1;
}) {
  const here = filled.indexOf(key(at.year, at.month));
  const next = filled[here + dir];
  return (
    <button
      type="button"
      disabled={!next}
      onClick={() => next && setAt({ year: Number(next.slice(0, 4)), month: Number(next.slice(5)) })}
      aria-label={dir < 0 ? "上一个月" : "下一个月"}
      title={next ? next.replace("-", " 年 ") + " 月" : undefined}
      className="text-lg text-[#a2916f] hover:text-[#7a5f3a] disabled:opacity-30"
    >
      {dir < 0 ? "‹" : "›"}
    </button>
  );
}
