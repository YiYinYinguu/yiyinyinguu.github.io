"use client";

import Image from "next/image";
import { useState } from "react";
import type { LifePost } from "@/lib/life";
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

function dot(date: string) {
  return date.replace(/-/g, ".");
}

/** 同一道菜的所有作品：收起来是一叠拍立得，点开摊成一排。 */
export default function JournalStack({
  title,
  posts,
  ink,
  onOpen,
}: {
  title: string;
  posts: LifePost[];
  ink: string;
  onOpen: (post: LifePost) => void;
}) {
  const t = useT();
  const dishName = useTitle();
  const count = useCount();
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(false);
  // 只做过一次的没什么可展开的，点了直接进弹窗
  const single = posts.length === 1;

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
                className="w-[124px] sm:w-[142px] bg-white rounded-[2px] p-2 pb-6 shadow-[0_3px_10px_rgba(90,70,40,0.22)] transition-transform duration-300 group-hover:scale-[1.05] group-hover:rotate-0"
                style={{ transform: `rotate(${TILT[i % TILT.length]}deg)` }}
              >
                <Image
                  src={post.square ?? post.cover ?? ""}
                  alt={`${dishName(post)} ${dot(post.date)}`}
                  width={700}
                  height={700}
                  sizes="142px"
                  className="block w-full aspect-square object-cover bg-gray-100"
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
      className="flex gap-4 items-start text-left"
    >
      {/* 高度留够最深那张错出去的距离，不然摊开时会被裁掉 */}
      <div
        className="relative flex-shrink-0"
        style={{ width: CARD, height: CARD + 22 + (single ? 0 : HOVER.y * (PEEK - 1)) }}
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
              src={post.square ?? post.cover ?? ""}
              alt={i === 0 ? dishName(post) : ""}
              width={700}
              height={700}
              sizes="178px"
              className="block w-full aspect-square object-cover bg-gray-100"
            />
          </div>
        ))}
      </div>

      <div className="flex-1 min-w-0 border border-[#e0d3a8] rounded-[3px] px-3.5 py-3.5 min-h-[200px] flex flex-col">
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
