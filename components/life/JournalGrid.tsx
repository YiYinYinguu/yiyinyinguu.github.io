"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LifePost, Recipe } from "@/lib/life";
import { useCount, useLang, useT, useTitle } from "@/lib/life-i18n";
import JournalStack from "./JournalStack";
import CalendarView from "./CalendarView";
import TimelineView from "./TimelineView";

// 手账每格轮换的颜色：标题底色是它加 40% 透明，正文是它的实色
const INK = ["#7a5fa0", "#9a6b3f", "#5f8055", "#a85a70", "#4f7a99", "#b5793a"];
// 拍立得的倾斜角，循环使用，避免每格都一样死板
const TILT = [-1.1, 1.2, -0.7, 1, -1.4, 0.8];

type Dir = "new" | "old";

/** 倾斜角按原始顺序定死，筛选、排序之后每篇的角度都不变。 */
function decorate(posts: LifePost[]) {
  return posts.map((post, i) => ({ post, tilt: TILT[i % TILT.length] }));
}

export default function JournalGrid({
  posts,
  category,
}: {
  posts: LifePost[];
  category: string;
}) {
  const t = useT();
  const lang = useLang();
  const title = useTitle();
  const [kind, setKind] = useState<string>("");
  const [dir, setDir] = useState<Dir>("new");
  const [often, setOften] = useState(false);
  const [view, setView] = useState<"list" | "calendar" | "timeline">("list");
  const [open, setOpen] = useState<number | null>(null);

  const decorated = useMemo(() => decorate(posts), [posts]);
  // 排一下序，免得筛选按钮的先后跟着「哪篇最新」变来变去
  const kinds = useMemo(
    () =>
      [
        ...new Set(posts.map((p) => p.kind).filter((k): k is string => !!k)),
      ].sort(),
    [posts],
  );

  // 每道菜的颜色按它头一次出现的位置定，筛选、排序都不会让它变色
  const inkOf = useMemo(() => {
    const seen: string[] = [];
    posts.forEach((p) => !seen.includes(p.title) && seen.push(p.title));
    return new Map(seen.map((t, i) => [t, INK[i % INK.length]]));
  }, [posts]);

  const shown = useMemo(() => {
    const filtered = kind
      ? decorated.filter((d) => d.post.kind === kind)
      : decorated;
    // posts 传进来已经是最新在前，要最早在前反过来就行
    return dir === "new" ? filtered : [...filtered].reverse();
  }, [decorated, kind, dir]);

  // 按次数看时一道菜只占一格，做得最多的排前面；组内沿用上面的日期方向
  const groups = useMemo(() => {
    const by = new Map<string, LifePost[]>();
    shown.forEach(({ post }) =>
      by.set(post.title, [...(by.get(post.title) ?? []), post]),
    );
    return [...by.entries()]
      .map(([title, list]) => ({
        title,
        posts: list,
        ink: inkOf.get(title) ?? INK[0],
      }))
      .sort(
        (a, b) =>
          b.posts.length - a.posts.length || (a.title < b.title ? -1 : 1),
      );
  }, [shown, inkOf]);

  // 换筛选、换排序时顺手关掉弹窗——那篇可能已经不在列表里了
  const pick = (k: string) => {
    setKind(k);
    setOpen(null);
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {/* 视图和筛选靠左钉住；排序推到右边，这样它出现或消失都不会挤动左边 */}
        {(["list", "calendar", "timeline"] as const).map((v) => (
          <Pill
            key={v}
            active={view === v}
            onClick={() => {
              setView(v);
              if (v !== "list") setOften(false);
              setOpen(null);
            }}
          >
            {t(v)}
          </Pill>
        ))}
        <span className="w-px h-5 bg-[#ded3b6] mx-1" />
        <Pill active={!kind} onClick={() => pick("")}>
          {t("all")}
        </Pill>
        {kinds.map((k) => (
          <Pill key={k} active={kind === k} onClick={() => pick(k)}>
            {k === "中式" ? t("chinese") : k === "西式" ? t("western") : k}
          </Pill>
        ))}
        {/* 排序只有列表和时间轴用得上：日历本身就是按时间铺的，
            「最多次做」更是只有列表在按菜名分组时才有意义 */}
        {view !== "calendar" && (
          <div className="flex flex-wrap items-center gap-2 ml-auto">
            <Pill
              active={!often || view !== "list"}
              onClick={() => {
                if (often) setOften(false);
                else setDir(dir === "new" ? "old" : "new");
                setOpen(null);
              }}
            >
              {dir === "new" ? t("newestFirst") : t("oldestFirst")}
            </Pill>
            {view === "list" && (
              <Pill
                active={often}
                onClick={() => {
                  setOften(true);
                  setOpen(null);
                }}
              >
                {t("mostMade")}
              </Pill>
            )}
          </div>
        )}
      </div>

      {view === "calendar" && (
        <CalendarView
          posts={shown.map((d) => d.post)}
          onOpen={(p) => setOpen(posts.indexOf(p))}
        />
      )}

      {view === "timeline" && (
        <TimelineView
          posts={shown.map((d) => d.post)}
          newestFirst={dir === "new"}
          onOpen={(p) => setOpen(posts.indexOf(p))}
        />
      )}

      {view === "list" && (
        <div className="journal-paper rounded-lg p-5 sm:p-7">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
            {often &&
              groups.map((g) => (
                <JournalStack
                  key={g.title}
                  title={g.title}
                  posts={g.posts}
                  ink={g.ink}
                  onOpen={(post) => setOpen(posts.indexOf(post))}
                />
              ))}
            {!often &&
              shown.map(({ post, tilt }) => {
                const ink = inkOf.get(post.title) ?? INK[0];
                const img = post.square ?? post.cover;
                return (
                  <a
                    key={post.slug}
                    href={`/life/${category}/${post.slug}/`}
                    onClick={(e) => {
                      // 保留真链接，中键和右键另存为照常，左键才拦下来开弹窗
                      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
                      e.preventDefault();
                      setOpen(posts.indexOf(post));
                    }}
                    className="group flex gap-4 items-start"
                  >
                    {img && (
                      <div
                        className="flex-shrink-0 w-[150px] sm:w-[178px] bg-white rounded-[2px] p-[10px] pb-8 shadow-[0_3px_10px_rgba(90,70,40,0.22)] transition-transform duration-300 group-hover:scale-[1.03] group-hover:rotate-0"
                        style={{ transform: `rotate(${tilt}deg)` }}
                      >
                        <Image
                          src={img}
                          alt={post.title}
                          width={700}
                          height={700}
                          sizes="(max-width: 640px) 45vw, 178px"
                          className="block w-full aspect-square object-cover bg-gray-100"
                        />
                      </div>
                    )}
                    {/* 高度对齐拍立得外框：图是正方形，加上 10px 内边距和 32px 下沿 */}
                    <div className="flex-1 min-w-0 border border-[#e0d3a8] rounded-[3px] px-3.5 py-3.5 min-h-[172px] sm:min-h-[200px] flex flex-col">
                      <div>
                        <span
                          className={`journal-hand inline text-white leading-[1.75] px-2.5 py-[2px] rounded-[3px] box-decoration-clone ${
                        lang === "zh" ? "text-xl sm:text-[23px]" : "text-lg sm:text-[19px]"
                      }`}
                          style={{
                            background: `color-mix(in srgb, ${ink} 40%, transparent)`,
                          }}
                        >
                          #{title(post)}
                        </span>
                      </div>
                      {post.note && (
                        <p
                          className="journal-hand text-[15px] sm:text-lg leading-[1.95] mt-2.5"
                          style={{ color: ink }}
                        >
                          {post.note.split("|").map((line, k) => (
                            <span key={k} className="block">
                              {line.trim()}
                            </span>
                          ))}
                        </p>
                      )}
                      <span
                        className="journal-hand text-sm sm:text-base mt-auto pt-3 self-end opacity-70"
                        style={{ color: ink }}
                      >
                        {/* 有食谱的标一下，不然得一篇篇点开才知道 */}
                        {post.recipes.length > 0 && (
                          <span className="mr-1.5">✎</span>
                        )}
                        {post.date.replace(/-/g, ".")}
                      </span>
                    </div>
                  </a>
                );
              })}
          </div>

          {shown.length === 0 && (
            <p className="journal-hand text-center text-xl py-16 text-[#9a6b3f]">
              {t("empty")}
            </p>
          )}
        </div>
      )}

      {open !== null && (
        <PostDialog
          post={posts[open]}
          ink={inkOf.get(posts[open].title) ?? INK[0]}
          onClose={() => setOpen(null)}
        />
      )}
    </>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`journal-hand text-base px-3.5 py-1 rounded-full border transition-colors ${
        active
          ? "bg-[#9a6b3f] border-[#9a6b3f] text-white"
          : "bg-white/60 border-[#ded3b6] text-[#7d6a4a] hover:bg-white"
      }`}
    >
      {children}
    </button>
  );
}

function PostDialog({
  post,
  ink,
  onClose,
}: {
  post: LifePost;
  ink: string;
  onClose: () => void;
}) {
  const t = useT();
  const lang = useLang();
  const title = useTitle();
  const [i, setI] = useState(0);
  const count = post.photos.length;
  const step = useCallback(
    (d: number) => setI((n) => (n + d + count) % count),
    [count],
  );
  const shell = useRef<HTMLDivElement>(null);

  // 弹窗盖住整屏，从日历捏进来之后再捏就落在这上面。不拦的话浏览器会把整页
  // 放大——那不是这里想要的缩放。往外捏就当作退回上一层。
  useEffect(() => {
    const el = shell.current;
    if (!el) return;
    let acc = 0;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      if (acc * e.deltaY < 0) acc = 0;
      acc += e.deltaY;
      if (acc > 36) {
        acc = 0;
        onClose();
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    // 弹窗打开时锁住背景滚动，否则滚轮会带着后面的列表跑
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose, step]);

  return (
    <div
      ref={shell}
      role="dialog"
      aria-modal="true"
      aria-label={post.title}
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/55 flex items-center justify-center p-4 sm:p-8 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="journal-paper rounded-lg max-w-2xl w-full p-5 sm:p-7 my-auto relative"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t("close")}
          className="absolute right-3 top-2 text-2xl leading-none text-[#8a7a5c] hover:text-[#5a4a2c]"
        >
          ×
        </button>

        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex-shrink-0 mx-auto sm:mx-0">
            <button
              type="button"
              onClick={() => step(1)}
              aria-label={t("nextPhoto")}
              className="block bg-white rounded-[2px] p-3 pb-10 shadow-[0_4px_14px_rgba(90,70,40,0.28)] cursor-pointer"
            >
              {/* 列表里的方图是裁过的，点开要看完整构图，所以按原比例显示。
                  用原生 img 是因为高度随图而变，next/image 得先知道尺寸。 */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.photos[i]}
                alt={`${title(post)} ${i + 1}/${count}`}
                className="block max-h-[58vh] w-auto max-w-[260px] sm:max-w-[300px] bg-gray-100"
              />
            </button>
            {count > 1 && (
              <div className="flex flex-wrap gap-2 mt-3 max-w-[286px] sm:max-w-[326px]">
                {post.photos.map((p, k) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setI(k)}
                    aria-label={`第 ${k + 1} 张`}
                    aria-current={k === i}
                    className={`w-12 h-12 rounded-[2px] overflow-hidden border-2 ${
                      k === i
                        ? "border-[#9a6b3f]"
                        : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={p}
                      alt=""
                      width={200}
                      height={200}
                      sizes="48px"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 flex flex-col">
            <div>
              <span
                className={`journal-hand inline text-white leading-[1.8] px-3 py-[2px] rounded-[3px] box-decoration-clone ${
                  lang === "zh" ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl"
                }`}
                style={{
                  background: `color-mix(in srgb, ${ink} 40%, transparent)`,
                }}
              >
                #{title(post)}
              </span>
            </div>
            {post.note && (
              <p
                className="journal-hand text-lg leading-[1.95] mt-4"
                style={{ color: ink }}
              >
                {post.note.split("|").map((line, k) => (
                  <span key={k} className="block">
                    {line.trim()}
                  </span>
                ))}
              </p>
            )}
            {post.recipes.length > 0 && (
              <ul className="mt-4 space-y-3.5">
                {post.recipes.map((r) => (
                  <RecipeLine key={r.name} recipe={r} ink={ink} />
                ))}
              </ul>
            )}
            <div
              className="journal-hand text-base mt-auto pt-6 flex items-center gap-3 opacity-75"
              style={{ color: ink }}
            >
              <span>{post.date.replace(/-/g, ".")}</span>
              {post.kind && (
                <span>
                  · {post.kind === "中式" ? t("chinese") : t("western")}
                </span>
              )}
              {count > 1 && (
                <span className="ml-auto">
                  {i + 1} / {count}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** 弹窗里的一条食谱：名字点出去看做法，用料收在下面按需展开。 */
function RecipeLine({ recipe, ink }: { recipe: Recipe; ink: string }) {
  const t = useT();
  const [open, setOpen] = useState(true);
  return (
    <li>
      {/* 菜谱名是别人的标题，混着英文、假名、颜文字，毛笔体里好些字根本没有，
          一行拼出三种字体。用正文字体反而干净，也跟自己写的话分得开。 */}
      <a
        href={recipe.url}
        target="_blank"
        rel="noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="text-[15px] underline decoration-dotted underline-offset-4 hover:opacity-65"
        style={{ color: ink }}
      >
        ✎ {recipe.name}
      </a>
      {recipe.ingredients.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="block text-sm mt-3 opacity-70 hover:opacity-100"
            style={{ color: ink }}
          >
            {t("ingredients")} {recipe.ingredients.length} {open ? "▴" : "▾"}
          </button>
          {open && (
            <ul className="text-[13px] leading-[1.8] text-gray-500 mt-1.5 ml-5 columns-2 gap-4">
              {recipe.ingredients.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          )}
        </>
      )}
    </li>
  );
}
