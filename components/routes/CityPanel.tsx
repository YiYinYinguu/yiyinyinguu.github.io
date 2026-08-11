"use client";

import type { Track } from "@/lib/routes";
import { useCount, useKind, useShortNote, useT } from "@/lib/life-i18n";
import { MIN_KM_RANGE, color, fmtDate, type Sort } from "./shared";

/** 一排药丸按钮，类型筛选和排序都用它。 */
function Chip({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`inline-flex items-center gap-[5px] rounded-full border px-3 py-[3px] text-[12.5px] transition-colors ${
        on
          ? "border-primary bg-primary text-white"
          : "border-gray-200 text-gray-500 hover:border-primary hover:text-primary"
      }`}
    >
      {children}
    </button>
  );
}

/**
 * 二级页右栏：筛选 + 主要路线清单。
 *
 * 「主要路线」是里程达到门槛的那些，可以点进去单独看；短于门槛的那些在地图上
 * 画成浅色底子，不列出来——一百多条通勤记录列成清单没人会看。
 */
export default function CityPanel({
  tracks,
  visible,
  main,
  kind,
  year,
  minKm,
  sort,
  hot,
  onKind,
  onYear,
  onMinKm,
  onSort,
  onHot,
  onPick,
}: {
  /** 该城全部路线，用来数各类型和各年份有多少 */
  tracks: Track[];
  /** 按类型和年份筛过的 */
  visible: Track[];
  /** visible 里达到里程门槛、并且已经排好序的——排序在上层做，这里不再动 */
  main: Track[];
  kind: string | null;
  year: string | null;
  minKm: number;
  sort: Sort;
  hot: string | null;
  onKind: (k: string | null) => void;
  onYear: (y: string | null) => void;
  onMinKm: (km: number) => void;
  onSort: (s: Sort) => void;
  onHot: (id: string | null) => void;
  onPick: (t: Track) => void;
}) {
  const t = useT();
  const kindName = useKind();
  const count = useCount();
  const shortNote = useShortNote();

  const kinds = new Map<string, number>();
  const years = new Map<string, number>();
  tracks.forEach((tr) => {
    kinds.set(tr.k, (kinds.get(tr.k) ?? 0) + 1);
    const y = tr.d.slice(0, 4);
    years.set(y, (years.get(y) ?? 0) + 1);
  });
  const yearList = [...years.keys()].sort();
  const tallest = Math.max(...years.values(), 1);

  const short = visible.length - main.length;
  const mainKm = main.reduce((sum, tr) => sum + tr.km, 0);

  return (
    <>
      <div className="shrink-0 rounded-md border border-gray-200 p-3">
        <div className="mb-[10px]">
          <b className="mb-1.5 block text-[11.5px] font-semibold text-gray-500">{t("type")}</b>
          <div className="flex flex-wrap gap-1.5">
            <Chip on={kind === null} onClick={() => onKind(null)}>
              {t("all")} {tracks.length}
            </Chip>
            {[...kinds].map(([k, n]) => (
              <Chip key={k} on={kind === k} onClick={() => onKind(k)}>
                <i
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: color(k) }}
                  aria-hidden
                />
                {kindName(k)} {n}
              </Chip>
            ))}
          </div>
        </div>

        {yearList.length > 1 && (
          <div className="mb-[10px]">
            <b className="mb-1.5 block text-[11.5px] font-semibold text-gray-500">{t("year")}</b>
            <div className="flex h-8 items-end gap-[3px]">
              {yearList.map((y) => (
                <button
                  key={y}
                  type="button"
                  title={`${y} · ${years.get(y)}`}
                  onClick={() => onYear(year === y ? null : y)}
                  className="group text-center"
                >
                  <i
                    className={`block w-6 rounded-t-sm transition-colors ${
                      year === y ? "bg-primary" : "bg-[#e5e0d8] group-hover:bg-primary"
                    }`}
                    style={{ height: 6 + ((years.get(y) ?? 0) / tallest) * 20 }}
                  />
                  <span
                    className={`mt-0.5 block text-[9.5px] ${
                      year === y ? "font-semibold text-primary" : "text-gray-400"
                    }`}
                  >
                    {y.slice(2)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <b className="mb-1.5 block text-[11.5px] font-semibold text-gray-500">{t("distance")}</b>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={MIN_KM_RANGE.min}
              max={MIN_KM_RANGE.max}
              step={MIN_KM_RANGE.step}
              value={minKm}
              onChange={(e) => onMinKm(parseFloat(e.target.value))}
              className="h-4 flex-1 accent-primary"
              aria-label={t("distance")}
            />
            <span className="whitespace-nowrap text-[12px] font-semibold tabular-nums text-primary">
              ≥ {minKm.toFixed(1)} km
            </span>
          </div>
        </div>
      </div>

      <div className="mt-[11px] flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-gray-200">
        <h4 className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-gray-50 py-[7px] pl-3 pr-2 text-[12px] font-semibold text-gray-500">
          <span>{t("mainRoutes")}</span>
          <span className="flex gap-[5px]">
            {([
              { by: "date" as const, label: t("byDate") },
              { by: "km" as const, label: t("byDistance") },
            ]).map((o) => {
              const on = sort.by === o.by;
              return (
                <button
                  key={o.by}
                  type="button"
                  // 点当前这个就调头，点另一个就换字段（换过去默认从新到旧、从长到短）
                  onClick={() => onSort(on ? { by: o.by, asc: !sort.asc } : { by: o.by, asc: false })}
                  className={`rounded px-[5px] py-px text-[11.5px] transition-colors ${
                    on ? "bg-[#fdf6f6] font-semibold text-primary" : "text-gray-400 hover:bg-[#fdf6f6] hover:text-primary"
                  }`}
                >
                  {o.label}
                  {on ? (sort.asc ? " ↑" : " ↓") : ""}
                </button>
              );
            })}
          </span>
        </h4>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {main.length === 0 ? (
            <div className="px-3 py-5 text-center text-[12.5px] text-gray-400">{t("noRoutes")}</div>
          ) : (
            main.map((tr) => (
              <button
                key={tr.id}
                type="button"
                onMouseEnter={() => onHot(tr.id)}
                onMouseLeave={() => onHot(null)}
                onFocus={() => onHot(tr.id)}
                onBlur={() => onHot(null)}
                onClick={() => onPick(tr)}
                className={`flex w-full items-center gap-2 border-b border-gray-100 px-3 py-2 text-left text-[12.5px] transition-colors ${
                  hot === tr.id ? "bg-[#fdf6f6]" : "hover:bg-[#fdf6f6]"
                }`}
              >
                <i
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: color(tr.k) }}
                  aria-hidden
                />
                <span className="text-gray-500">{fmtDate(tr.d)}</span>
                <span className="ml-auto tabular-nums text-gray-400">{tr.km.toFixed(1)} km</span>
                <span className="text-[12px] text-gray-300">›</span>
              </button>
            ))
          )}
        </div>

        <div className="shrink-0 border-t border-gray-200 bg-gray-50 px-3 py-2 text-[11.5px] leading-relaxed text-gray-400">
          <b className="text-[12.5px] font-semibold text-gray-900">
            {count(main.length)} · {mainKm.toFixed(1)} km
          </b>
          {short > 0 && <span className="mt-1 block">{shortNote(short, minKm)}</span>}
        </div>
      </div>
    </>
  );
}
