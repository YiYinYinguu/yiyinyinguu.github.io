"use client";

import Image from "next/image";
import { useState } from "react";
import type { LifePost } from "@/lib/life";
import { editorialCover } from "@/lib/life-editorial";
import { useCount, useT, useTitle } from "@/lib/life-i18n";

// 照片一律和单张卡片同宽，所以错开主要靠往下压，横向只挪一点点——
// 挪多了整叠会伸到右边文字块上去，中间只有 16px 的空当。
const CARD = 178;
const STEP = { x: 2, y: 8 };
const HOVER = { x: 3, y: 14 };
// 一叠最多露 4 张，再多也看不清，反正点开就全有了
const PEEK = 4;
// 斜度也压着来，178px 的卡每斜 1 度就往外鼓 1.7px
const TILT = [-1.8, 1.5, -1.2, 2];
const EDITORIAL_CARD = 276;

function dot(date: string) {
  return date.replace(/-/g, ".");
}

/** 同一道菜的所有作品：收起来是一叠拍立得，点开摊成一排。 */
export default function JournalStack({
  posts,
  ink,
  editorialCategory,
  onOpen,
}: {
  posts: LifePost[];
  ink: string;
  editorialCategory?: string;
  onOpen: (post: LifePost) => void;
}) {
  const t = useT();
  const dishName = useTitle();
  const count = useCount();
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(false);
  const editorial = Boolean(editorialCategory);
  const squareEditorial = editorialCategory === "craft";
  // 只做过一次的没什么可展开的，点了直接进弹窗
  const single = posts.length === 1;
  const imageOf = (post: LifePost) =>
    editorialCategory
      ? editorialCover(editorialCategory, post.slug)
      : post.square ?? post.cover ?? "";

  const label = (
    <span
      className="journal-hand inline text-white text-xl sm:text-[23px] leading-[1.55] px-2.5 py-[2px] rounded-[3px] box-decoration-clone"
      style={{ background: `color-mix(in srgb, ${ink} 40%, transparent)` }}
    >
      #{dishName(posts[0])}
    </span>
  );
  // 传进来已按当前排序排好，两头就是这道菜的起止
  const span = [posts[0], posts[posts.length - 1]]
    .map((p) => dot(p.date))
    .filter((d, i, all) => all.indexOf(d) === i);

  if (editorial) {
    if (open) {
      return (
        <div className="col-span-full w-full rounded-[3px] border border-[#e0d3a8] px-4 py-5 sm:px-5">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            {label}
            <span className="journal-hand text-base opacity-70" style={{ color: ink }}>
              {count(posts.length)}
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="journal-hand ml-auto text-base opacity-70 hover:opacity-100"
              style={{ color: ink }}
            >
              {t("collapse")}
            </button>
          </div>

          <div className="grid grid-cols-1 justify-items-center gap-x-7 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {posts.map((post, i) => (
              <button
                key={post.slug}
                type="button"
                onClick={() => onOpen(post)}
                className="journal-fan-in group block w-full max-w-[276px] text-left"
                style={{ animationDelay: `${i * 45}ms` }}
              >
                <div
                  className="w-full rounded-[2px] bg-white p-3 pb-3 shadow-[0_3px_10px_rgba(90,70,40,0.22)] transition-transform duration-300 group-hover:scale-[1.03] group-hover:rotate-0"
                  style={{ transform: `rotate(${TILT[i % TILT.length]}deg)` }}
                >
                  <Image
                    src={imageOf(post)}
                    alt={`${dishName(post)} ${dot(post.date)}`}
                    width={1024}
                    height={squareEditorial ? 1024 : 1536}
                    sizes="252px"
                    className={`block w-full bg-gray-100 object-contain ${
                      squareEditorial ? "aspect-square" : "aspect-[2/3]"
                    }`}
                  />
                  <div className="flex min-h-[72px] flex-col px-1 pb-1 pt-3">
                    <div>{label}</div>
                    <span
                      className="journal-hand mt-auto self-end pt-1.5 text-xs opacity-70"
                      style={{ color: ink }}
                    >
                      {post.recipes.length > 0 && <span className="mr-1.5">✎</span>}
                      {dot(post.date)}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      );
    }

    const off = hover ? HOVER : STEP;
    const visible = posts.slice(0, PEEK);
    const stackHeight = (squareEditorial ? 348 : 474) + (visible.length - 1) * HOVER.y;

    return (
      <button
        type="button"
        onClick={() => (single ? onOpen(posts[0]) : setOpen(true))}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className="group block w-full max-w-[276px] text-left"
      >
        <div
          className="relative w-full"
          style={{ width: EDITORIAL_CARD, maxWidth: "100%", height: stackHeight }}
        >
          {visible.map((post, i) => (
            <div
              key={post.slug}
              className="absolute left-0 top-0 w-full rounded-[2px] bg-white p-3 pb-3 shadow-[0_3px_10px_rgba(90,70,40,0.22)] transition-transform duration-300"
              style={{
                transform: `translate(${i * off.x}px, ${i * off.y}px) rotate(${
                  i === 0 ? 0 : TILT[i % TILT.length]
                }deg) scale(${i === 0 && hover ? 1.03 : 1})`,
                zIndex: PEEK - i,
              }}
            >
              <Image
                src={imageOf(post)}
                alt={i === 0 ? dishName(post) : ""}
                width={1024}
                height={squareEditorial ? 1024 : 1536}
                sizes="252px"
                className={`block w-full bg-gray-100 object-contain ${
                  squareEditorial ? "aspect-square" : "aspect-[2/3]"
                }`}
              />
              <div className="flex min-h-[72px] flex-col px-1 pb-1 pt-3">
                <div>{label}</div>
                <span
                  className="journal-hand mt-auto flex items-end justify-between gap-2 pt-1.5 text-xs opacity-70"
                  style={{ color: ink }}
                >
                  {!single && <span>{count(posts.length)}</span>}
                  <span className="ml-auto">{span.join(" — ")}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </button>
    );
  }

  if (open) {
    return (
      <div className="col-span-full border border-[#e0d3a8] rounded-[3px] px-4 py-4">
        <div className="flex items-center gap-3 flex-wrap">
          {label}
          <span className="journal-hand text-base opacity-70" style={{ color: ink }}>
            {count(posts.length)}
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="journal-hand text-base ml-auto opacity-70 hover:opacity-100"
            style={{ color: ink }}
          >
            {t("collapse")}
          </button>
        </div>

        <div className="flex flex-wrap gap-4 mt-4">
          {posts.map((post, i) => (
            <button
              key={post.slug}
              type="button"
              onClick={() => onOpen(post)}
              className="journal-fan-in group block"
              style={{ animationDelay: `${i * 45}ms` }}
            >
              <div
                className={`bg-white rounded-[2px] p-2 shadow-[0_3px_10px_rgba(90,70,40,0.22)] transition-transform duration-300 group-hover:scale-[1.05] group-hover:rotate-0 ${
                  editorial
                    ? "w-[112px] pb-5 sm:w-[128px]"
                    : "w-[124px] pb-6 sm:w-[142px]"
                }`}
                style={{ transform: `rotate(${TILT[i % TILT.length]}deg)` }}
              >
                <Image
                  src={imageOf(post)}
                  alt={`${dishName(post)} ${dot(post.date)}`}
                  width={editorial ? 1024 : 700}
                  height={editorial ? 1536 : 700}
                  sizes={editorial ? "128px" : "142px"}
                  className={`block w-full object-cover bg-gray-100 ${
                    editorial ? "aspect-[2/3]" : "aspect-square"
                  }`}
                />
              </div>
              <span
                className="journal-hand block text-sm text-center mt-2 opacity-70"
                style={{ color: ink }}
              >
                {dot(post.date)}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const off = hover ? HOVER : STEP;
  return (
    <button
      type="button"
      onClick={() => (single ? onOpen(posts[0]) : setOpen(true))}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="flex w-full flex-col gap-4 text-left min-[390px]:flex-row min-[390px]:items-start"
    >
      {/* 高度留够最深那张错出去的距离，不然摊开时会被裁掉 */}
      <div
        className="relative mx-auto flex-shrink-0 min-[390px]:mx-0"
        style={{
          width: CARD,
          height: (editorial ? 279 : CARD + 22) + (single ? 0 : HOVER.y * (PEEK - 1)),
        }}
      >
        {posts.slice(0, PEEK).map((post, i) => (
          <div
            key={post.slug}
            className="absolute left-0 top-0 bg-white rounded-[2px] p-[10px] pb-8 shadow-[0_3px_10px_rgba(90,70,40,0.22)] transition-transform duration-300"
            style={{
              width: CARD,
              // 越靠后的越往右下、越斜，最上面那张保持端正
              transform: `translate(${i * off.x}px, ${i * off.y}px) rotate(${
                i === 0 ? 0 : TILT[i % TILT.length]
              }deg) scale(${i === 0 && hover ? 1.04 : 1})`,
              zIndex: PEEK - i,
            }}
          >
            <Image
              src={imageOf(post)}
              alt={i === 0 ? dishName(post) : ""}
              width={editorial ? 1024 : 700}
              height={editorial ? 1536 : 700}
              sizes="178px"
              className={`block w-full object-cover bg-gray-100 ${
                editorial ? "aspect-[2/3]" : "aspect-square"
              }`}
            />
          </div>
        ))}
      </div>

      <div
        className={`min-h-[150px] w-full flex-1 min-w-0 border border-[#e0d3a8] rounded-[3px] px-3.5 py-3.5 flex flex-col ${
          editorial ? "min-[390px]:min-h-[279px]" : "min-[390px]:min-h-[200px]"
        }`}
      >
        <div>{label}</div>
        {!single && (
          <p className="journal-hand text-lg mt-3" style={{ color: ink }}>
            {count(posts.length)}
          </p>
        )}
        <span
          className="journal-hand text-sm sm:text-base mt-auto pt-3 self-end opacity-70"
          style={{ color: ink }}
        >
          {single && posts[0].recipes.length > 0 && <span className="mr-1.5">✎</span>}
          {span.join(" — ")}
        </span>
      </div>
    </button>
  );
}
