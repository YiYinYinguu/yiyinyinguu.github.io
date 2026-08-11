"use client";

import type { RouteCity } from "@/lib/routes";
import { useCount, useKind, useLang } from "@/lib/life-i18n";

/**
 * 一级页右栏。卡面那个小图不是图标，是那座城市全部轨迹按真实经纬度叠出来的形状——
 * 杭州是密的一团，新加坡是几条贯穿的长线，一眼能认出区别。路径在构建时就算好了。
 */
export default function CityCards({
  cities,
  active,
  onHover,
  onPick,
}: {
  cities: RouteCity[];
  active: string | null;
  onHover: (id: string | null) => void;
  onPick: (id: string) => void;
}) {
  const lang = useLang();
  const kind = useKind();
  const count = useCount();

  return (
    <div className="flex flex-col gap-[10px]">
      {cities.map((c) => (
        <button
          key={c.id}
          type="button"
          onMouseEnter={() => onHover(c.id)}
          onMouseLeave={() => onHover(null)}
          onFocus={() => onHover(c.id)}
          onBlur={() => onHover(null)}
          onClick={() => onPick(c.id)}
          className={`group flex items-center gap-3 rounded-md border p-[11px_13px] text-left transition-all ${
            active === c.id
              ? "border-primary bg-[#fefafa] shadow-[0_2px_10px_rgba(177,43,50,0.07)]"
              : "border-gray-200 bg-white hover:border-primary hover:bg-[#fefafa]"
          }`}
        >
          <span className="shrink-0 rounded bg-[#f7f5f2] leading-none">
            <svg viewBox="0 0 100 100" width={50} height={50} aria-hidden>
              <path
                d={c.thumb}
                fill="none"
                stroke="#b12b32"
                strokeWidth={c.n > 50 ? 0.9 : 1.6}
                strokeOpacity={0.6}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>

          <span className="min-w-0">
            <span className="block text-[14.5px] font-semibold text-gray-900">
              {lang === "zh" ? c.zh : c.en}
            </span>
            <span className="mt-0.5 block text-[11.5px] text-gray-400">
              {count(c.n)} · {c.km} km
            </span>
            <span className="mt-[3px] block text-[11px] text-gray-500">
              {Object.entries(c.kinds)
                .map(([k, n]) => `${kind(k)} ${n}`)
                .join(" · ")}
            </span>
          </span>

          <span className="ml-auto text-[15px] text-gray-400 transition-colors group-hover:text-primary">
            →
          </span>
        </button>
      ))}
    </div>
  );
}
