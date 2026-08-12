"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { RouteCity, Track } from "@/lib/routes";
import {
  LangProvider,
  useCityCount,
  useCount,
  useKind,
  useLang,
  useT,
  type Lang,
} from "@/lib/life-i18n";
import { readParams, writeParam } from "@/lib/url-state";
import CityCards from "./CityCards";
import CityPanel from "./CityPanel";
import RouteDetail from "./RouteDetail";
import { DEFAULT_MIN_KM, fmtMonth, sortTracks, type Sort } from "./shared";

// 两层都得挡在服务端之外：Leaflet 一加载就摸 window，
// 地球仪要量容器尺寸、还要 fetch 陆地数据。
const placeholder = () => (
  <div className="flex-1 rounded-md border border-gray-200 bg-gray-50" />
);
const CityMap = dynamic(() => import("./CityMap"), { ssr: false, loading: placeholder });
const Globe = dynamic(() => import("./Globe"), { ssr: false, loading: placeholder });

const UNIT = { zh: "条", one: "route", many: "routes" };

export type Summary = {
  regions: number;
  places: number;
  tracks: number;
  km: number;
  from: string;
  to: string;
};

export default function RoutesExplorer({
  cities,
  summary,
}: {
  cities: RouteCity[];
  summary: Summary;
}) {
  return (
    <LangProvider unit={UNIT}>
      {(lang, setLang) => (
        <Explorer cities={cities} summary={summary} lang={lang} setLang={setLang} />
      )}
    </LangProvider>
  );
}

function Explorer({
  cities,
  summary,
  lang,
  setLang,
}: {
  cities: RouteCity[];
  summary: Summary;
  lang: Lang;
  setLang: (l: Lang) => void;
}) {
  const t = useT();
  const kindName = useKind();
  const count = useCount();
  const cityCount = useCityCount();

  const [cityId, setCityId] = useState<string | null>(null);
  const [routeId, setRouteId] = useState<string | null>(null);
  const [kind, setKind] = useState<string | null>(null);
  const [year, setYear] = useState<string | null>(null);
  const [minKm, setMinKm] = useState(DEFAULT_MIN_KM);
  const [sort, setSort] = useState<Sort>({ by: "date", asc: false });
  const [hot, setHot] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [fitToken, setFitToken] = useState(0);
  const [tracks, setTracks] = useState<Track[]>([]);

  const city = cities.find((c) => c.id === cityId) ?? null;

  // 一级页只拿到了清单和缩略图，坐标是点进城市才取的——
  // 没必要为了看世界地图先下 150KB 的轨迹点。
  const cache = useRef(new Map<string, Track[]>());
  useEffect(() => {
    if (!cityId) {
      setTracks([]);
      return;
    }
    const cached = cache.current.get(cityId);
    if (cached) {
      setTracks(cached);
      return;
    }
    let alive = true;
    fetch(`/routes/${cityId}.json`)
      .then((r) => r.json())
      .then((data: { tracks: Track[] }) => {
        if (!alive) return;
        cache.current.set(cityId, data.tracks);
        setTracks(data.tracks);
      })
      .catch(() => alive && setTracks([]));
    return () => {
      alive = false;
    };
  }, [cityId]);

  // 地址栏里的状态优先——那是别人发过来的链接，应该按发的人看到的样子打开
  const ready = useRef(false);
  useEffect(() => {
    const params = readParams();
    const c = params.get("city");
    if (c && cities.some((x) => x.id === c)) setCityId(c);
    const r = params.get("route");
    if (r) setRouteId(r);
    const k = params.get("kind");
    if (k) setKind(k);
    const y = params.get("year");
    if (y) setYear(y);
    const m = parseFloat(params.get("min") ?? "");
    if (!Number.isNaN(m)) setMinKm(m);
    const s = params.get("sort");
    if (s) setSort({ by: s.startsWith("km") ? "km" : "date", asc: s.endsWith("-asc") });
    ready.current = true;
  }, [cities]);

  useEffect(() => {
    if (!ready.current) return;
    writeParam("city", cityId);
    writeParam("route", routeId);
    writeParam("kind", kind);
    writeParam("year", year);
    writeParam("min", minKm === DEFAULT_MIN_KM ? null : String(minKm));
    writeParam(
      "sort",
      sort.by === "date" && !sort.asc ? null : `${sort.by}${sort.asc ? "-asc" : ""}`
    );
  }, [cityId, routeId, kind, year, minKm, sort]);

  const visible = useMemo(
    () =>
      tracks.filter((tr) => (!kind || tr.k === kind) && (!year || tr.d.slice(0, 4) === year)),
    [tracks, kind, year]
  );
  const main = useMemo(
    () => sortTracks(visible.filter((tr) => tr.km >= minKm), sort),
    [visible, minKm, sort]
  );
  const route = routeId ? tracks.find((tr) => tr.id === routeId) ?? null : null;

  const toWorld = useCallback(() => {
    setCityId(null);
    setRouteId(null);
    setHot(null);
  }, []);
  const toCity = useCallback((id: string) => {
    setCityId(id);
    setRouteId(null);
    setKind(null);
    setYear(null);
    setHot(null);
  }, []);
  const toRoute = useCallback((tr: Track) => setRouteId(tr.id), []);

  // 一级页报的是整页的内容：去过多少国家和城市、骑走了多少；
  // 进了城市就只报那座城市自己的数
  const stat = city
    ? `${count(city.n)} · ${city.km} km · ${fmtMonth(city.from)} — ${fmtMonth(city.to)}`
    : lang === "zh"
      ? `${summary.regions} 个国家 · ${summary.places} 座城市 · ` +
        `骑行步行 ${summary.tracks} 条 ${summary.km} km · 截至 ${summary.to}`
      : `${summary.regions} countries · ${summary.places} places · ` +
        `${summary.tracks} routes on foot and by bike, ${summary.km} km · ` +
        `through ${summary.to}`;

  const cityName = city ? (lang === "zh" ? city.zh : city.en) : "";

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          {/* 标题本身就是面包屑，每一级都点得回去 */}
          <h1 className="mb-1 flex flex-wrap items-center gap-2 text-2xl font-bold text-gray-900">
            <Link href="/life/" className="font-normal text-gray-400 transition-colors hover:text-primary">
              {t("life")}
            </Link>
            <span className="font-normal text-gray-300">/</span>
            {city ? (
              <button
                type="button"
                onClick={toWorld}
                className="font-normal text-gray-400 transition-colors hover:text-primary"
              >
                🚲 {t("routes")}
              </button>
            ) : (
              <>
                <span>🚲</span>
                <span>{t("routes")}</span>
              </>
            )}
            {city && (
              <>
                <span className="font-normal text-gray-300">/</span>
                {route ? (
                  <button
                    type="button"
                    onClick={() => setRouteId(null)}
                    className="font-normal text-gray-400 transition-colors hover:text-primary"
                  >
                    {cityName}
                  </button>
                ) : (
                  <span>{cityName}</span>
                )}
              </>
            )}
            {route && (
              <>
                <span className="font-normal text-gray-300">/</span>
                <span>{route.d.replace(/-/g, ".")}</span>
              </>
            )}
          </h1>
          {/* 每一层都得有这一行。空着的话标题块会矮一截，整个版面跟着上跳，
              切换时看起来就像地图变大了——框其实一直是同一个尺寸。 */}
          <p className="text-base text-gray-600">
            {route
              ? `${kindName(route.k)} · ${route.km.toFixed(2)} km`
              : city
                ? lang === "zh"
                  ? `${cityName}的全部路线。`
                  : `Every route in ${cityName}.`
                : t("routesLede")}
          </p>
          <p className="mt-1 text-sm text-gray-400">{stat}</p>
        </div>

        {/* 跟 Life 其他板块同一种写法：当前的深色，另一个是链接 */}
        <div className="flex-shrink-0 text-sm sm:pt-1">
          {(["en", "zh"] as Lang[]).map((l, i) => (
            <span key={l}>
              {i > 0 && <span className="mx-2 text-gray-300">/</span>}
              <button
                type="button"
                onClick={() => setLang(l)}
                aria-pressed={lang === l}
                className={
                  lang === l ? "text-gray-900" : "text-gray-400 transition-colors hover:text-primary"
                }
              >
                {l === "en" ? "EN" : "中文"}
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* 三层同高，切换时版面不跳。两层都是 Leaflet，瓦片自己会填满容器，
          所以高度直接写死就行——不像之前那张手画的 svg，得让容器去迁就它的比例。 */}
      <div className="mt-5 grid items-stretch gap-[22px] md:grid-cols-[1.45fr_272px]">
        <div className="flex h-[350px] flex-col min-[390px]:h-[380px] md:h-[500px]">
          {city ? (
            <CityMap
              tracks={visible}
              minKm={minKm}
              focus={route}
              context={tracks}
              hot={hot}
              onHot={setHot}
              onPick={toRoute}
              kindLabel={kindName}
              fitKey={`${cityId}|${routeId}|${kind}|${year}|${minKm}`}
              fitToken={fitToken}
            >
              {/* 右下角是地图的版权文字，按钮都放右上 */}
              <div className="absolute right-2 top-2 z-[900] flex max-w-[calc(100%-1rem)] flex-wrap justify-end gap-1.5 sm:right-3 sm:top-3 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setFitToken((n) => n + 1)}
                  className="min-h-9 rounded-full border border-gray-200 bg-white px-3 py-1 text-[12.5px] text-gray-500 shadow-sm transition-colors hover:border-primary hover:text-primary"
                >
                  {t("fitAll")}
                </button>
                <button
                  type="button"
                  onClick={route ? () => setRouteId(null) : toWorld}
                  className="min-h-9 rounded-full border border-gray-200 bg-white px-3 py-1 text-[12.5px] text-gray-500 shadow-sm transition-colors hover:border-primary hover:text-primary"
                >
                  ← {route ? `${t("backTo")}${cityName}` : t("backToWorld")}
                </button>
              </div>

            </CityMap>
          ) : (
            <Globe cities={cities} active={hover} onHover={setHover} onPick={toCity} />
          )}
        </div>

        {/* 面板的内容在桌面上绝对定位：网格是 items-stretch，
            如果让内容自然撑高，城市层那一长串筛选加清单会把整行撑起来，
            地图跟着被拉伸，比例就失控了。行高只该由左边地图的比例决定。 */}
        <div className="relative min-h-0">
          <div className="flex flex-col md:absolute md:inset-0 md:overflow-y-auto">
          {!city ? (
            <CityCards cities={cities} active={hover} onHover={setHover} onPick={toCity} />
          ) : route ? (
            <RouteDetail track={route} siblings={main} onPick={toRoute} />
          ) : (
            <CityPanel
              tracks={tracks}
              visible={visible}
              main={main}
              kind={kind}
              year={year}
              minKm={minKm}
              sort={sort}
              hot={hot}
              onKind={setKind}
              onYear={setYear}
              onMinKm={setMinKm}
              onSort={setSort}
              onHot={setHot}
              onPick={toRoute}
            />
          )}
          </div>
        </div>
      </div>

      {!city && (
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-400">
          {/* 图例：球上三种记号各代表什么。不用图片，直接把记号本身画出来 */}
          <span className="flex items-center gap-1.5">
            <svg width="14" height="14" aria-hidden>
              <circle cx="7" cy="7" r="4.5" fill="#b12b32" stroke="#fff" strokeWidth="1.2" />
            </svg>
            {t("legendTracks")}
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="14" height="14" aria-hidden>
              <circle cx="7" cy="7" r="2.4" fill="#c8797e" stroke="#fff" strokeWidth="0.6" />
            </svg>
            {t("legendVisited")}
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="14" height="14" aria-hidden>
              <rect x="1" y="3" width="12" height="8" rx="1.5"
                    fill="#b12b32" fillOpacity="0.13" stroke="#cf9a9e" strokeWidth="0.8" />
            </svg>
            {t("legendArea")}
          </span>
          <span className="text-gray-300">·</span>
          <span>{t("cityHint")}</span>
        </div>
      )}
    </>
  );
}
