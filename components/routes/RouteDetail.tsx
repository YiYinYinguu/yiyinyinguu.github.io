"use client";

import type { Track } from "@/lib/routes";
import { useCount, useKind, useT } from "@/lib/life-i18n";
import { color, crowDistance, fmtDate } from "./shared";

/**
 * 三级页右栏：一条路线的详情 + 在同一批主要路线里前后翻。
 *
 * 「是否折返」是拿起终点的直线距离推的——绕西湖一圈和从家骑到公司，
 * 里程可能一样，但形状完全是两回事，这一行就是为了让人一眼分出来。
 */
export default function RouteDetail({
  track,
  siblings,
  onPick,
}: {
  track: Track;
  /** 按当前排序排好的主要路线，翻页顺序跟列表一致 */
  siblings: Track[];
  onPick: (t: Track) => void;
}) {
  const t = useT();
  const kindName = useKind();
  const count = useCount();

  const index = siblings.findIndex((s) => s.id === track.id);
  const prev = index > 0 ? siblings[index - 1] : null;
  const next = index >= 0 && index < siblings.length - 1 ? siblings[index + 1] : null;

  const crow = crowDistance(track.p[0], track.p[track.p.length - 1]);
  const c = color(track.k);

  return (
    <>
      <div className="shrink-0 overflow-hidden rounded-md border border-gray-200">
        <div className="border-b border-gray-200 p-[12px_14px]">
          <span
            className="inline-block rounded-[3px] px-2 py-0.5 text-[11.5px] text-white"
            style={{ background: c }}
          >
            {kindName(track.k)}
          </span>
          <div className="mt-2 text-[26px] font-bold tabular-nums text-gray-900">
            {track.km.toFixed(2)}
            <small className="ml-1 text-sm font-normal text-gray-400">km</small>
          </div>
          <div className="mt-0.5 text-[13px] text-gray-500">{fmtDate(track.d)}</div>
        </div>
        <dl className="py-1">
          {[
            [t("points"), String(track.p.length)],
            [t("asTheCrow"), `${crow.toFixed(2)} km`],
            // 起终点相距不到 300 米就算回到了原点——GPS 本身就有几十米的漂移
            [t("isLoop"), crow < 0.3 ? t("loopYes") : t("loopNo")],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between px-[14px] py-1.5 text-[12.5px]">
              <dt className="text-gray-400">{label}</dt>
              <dd className="text-gray-900">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-[11px] flex shrink-0 gap-2">
        <button
          type="button"
          disabled={!prev}
          onClick={() => prev && onPick(prev)}
          className="min-h-10 flex-1 justify-center rounded-full border border-gray-200 px-3 py-[3px] text-[12.5px] text-gray-500 transition-colors hover:border-primary hover:text-primary disabled:pointer-events-none disabled:opacity-40 sm:min-h-0"
        >
          ‹ {t("prevRoute")}
        </button>
        <button
          type="button"
          disabled={!next}
          onClick={() => next && onPick(next)}
          className="min-h-10 flex-1 justify-center rounded-full border border-gray-200 px-3 py-[3px] text-[12.5px] text-gray-500 transition-colors hover:border-primary hover:text-primary disabled:pointer-events-none disabled:opacity-40 sm:min-h-0"
        >
          {t("nextRoute")} ›
        </button>
      </div>

      <div className="mt-[11px] flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-gray-200">
        <h4 className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-gray-50 px-3 py-[7px] text-[12px] font-semibold text-gray-500">
          <span>{t("otherRoutes")}</span>
          <span className="font-normal text-gray-400">{count(siblings.length - 1)}</span>
        </h4>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {siblings
            .filter((s) => s.id !== track.id)
            .map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onPick(s)}
                className="flex w-full items-center gap-2 border-b border-gray-100 px-3 py-2 text-left text-[12.5px] transition-colors hover:bg-[#fdf6f6]"
              >
                <i
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: color(s.k) }}
                  aria-hidden
                />
                <span className="text-gray-500">{fmtDate(s.d)}</span>
                <span className="ml-auto tabular-nums text-gray-400">{s.km.toFixed(1)} km</span>
                <span className="text-[12px] text-gray-300">›</span>
              </button>
            ))}
        </div>
      </div>
    </>
  );
}
