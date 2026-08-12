"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { geoCentroid, geoDistance, geoGraticule10, geoOrthographic, geoPath } from "d3-geo";
import type { RouteCity } from "@/lib/routes";
import { useLang, useT } from "@/lib/life-i18n";
import { PINCH_PER_PX } from "./shared";

/** 默认转到亚洲这一面——她去过的地方都在这儿 */
const HOME: [number, number] = [-105, -18];
const SPIN_PER_MS = 0.004;
const MIN_SCALE = 0.85;
const MAX_SCALE = 8;
const WITH_TRACKS = new Set(["杭州", "北京", "新加坡"]);

type Collection = { type: "FeatureCollection"; features: unknown[] };
/** 飞过的城市和航线，来自航旅纵横的历史行程 */
/** 去过的地方：国内到省，国外到国 */
type Region = {
  type: "Feature";
  properties: { name: string; zh: string; en: string };
  geometry: unknown;
};
/** 两种粒度：coarse 是中国的省 + 国外的国家，fine 是中国的市县 + 国外的一级行政区 */
type Visited = { coarse: { features: Region[] }; fine: { features: Region[] } };
type Flights = {
  cities: { id: string; zh: string; en: string; lat: number; lon: number; n: number }[];
  routes: { a: string; b: string; n: number; from: [number, number]; to: [number, number] }[];
};
/** land 是陆地多边形，lines 是九段线这类只画线不填充的要素 */
type World = { land: Collection; lines: Collection };

/**
 * 一级页的地球仪：正射投影的真球面，可以拖着转，点城市进那一层。
 *
 * 用 d3-geo 而不是自己算投影——背面的裁切是这类投影最容易出错的地方，
 * 之前手写平面地图就在跨经线上栽过。球每帧重新投影，所以 React 只负责
 * 搭好节点结构，坐标由动画循环直接改属性：每帧重建 DOM 的话，
 * 鼠标按下和抬起之间节点会被换掉，click 就永远发不出来。
 */
export default function Globe({
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
  const t = useT();

  const box = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const seaRef = useRef<SVGCircleElement>(null);
  const rimRef = useRef<SVGCircleElement>(null);
  const shadeRef = useRef<SVGCircleElement>(null);
  const gridRef = useRef<SVGPathElement>(null);
  const landRef = useRef<SVGPathElement>(null);
  const linesRef = useRef<SVGPathElement>(null);
  const arcsRef = useRef<SVGPathElement>(null);
  const regionRefs = useRef(new Map<string, SVGPathElement>());
  const dotRefs = useRef(new Map<string, SVGGElement>());
  const pins = useRef(new Map<string, SVGGElement>());

  const [world, setWorld] = useState<World | null>(null);
  const [flights, setFlights] = useState<Flights | null>(null);
  const [visited, setVisited] = useState<Visited | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [loadToken, setLoadToken] = useState(0);
  // 航线默认关着：一进来先看清去过哪儿，想看怎么飞的再打开
  const [showArcs, setShowArcs] = useState(false);
  /** 去过的地方看到哪一级：整个国家一块色，还是拆到城市 */
  const [grain, setGrain] = useState<"region" | "city">("region");
  /** 鼠标停在哪个省/国/城市上，显示名字用 */
  const [over, setOver] = useState<{ label: string; x: number; y: number } | null>(null);
  const [spinning, setSpinning] = useState(true);

  const rotate = useRef<[number, number]>([...HOME]);
  const scale = useRef(1);
  const size = useRef({ w: 0, h: 0 });
  const drag = useRef<{ x: number; y: number; r: [number, number] } | null>(null);
  const dragged = useRef(false);
  const spin = useRef(true);
  spin.current = spinning;

  // 最新的回调放进 ref，动画循环和事件处理器就不用跟着重新绑定
  const handlers = useRef({ onHover, onPick });
  handlers.current = { onHover, onPick };
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    let alive = true;
    setLoadError(false);
    const load = async <T,>(path: string) => {
      const response = await fetch(path);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json() as Promise<T>;
    };
    Promise.all([
      load<World>("/routes/land.json"),
      load<Flights>("/routes/flights.json"),
      load<Visited>("/routes/visited.json"),
    ])
      .then(([worldData, flightData, visitedData]) => {
        if (!alive) return;
        setWorld(worldData);
        setFlights(flightData);
        setVisited(visitedData);
      })
      .catch(() => alive && setLoadError(true));
    return () => {
      alive = false;
    };
  }, [loadToken]);

  // 国家模式下也要看得见去过哪些城市，所以在整片底色上再点一层空心圈。
  // 位置直接取城市轮廓的球面重心——坐标是现成的，不用另配一份城市经纬度表。
  // 有轨迹的那几座已经有实心点了，这里跳过，免得一个位置两个圈。
  const dots = useMemo(
    () =>
      (visited?.fine.features ?? [])
        .filter((f) => !WITH_TRACKS.has(f.properties.zh))
        .map((f) => ({ ...f.properties, at: geoCentroid(f as never) })),
    [visited]
  );

  /** 每帧重画。只改属性，不动节点。 */
  const draw = useCallback(() => {
    const { w, h } = size.current;
    if (!w || !world) return;

    const radius = Math.min(w, h) / 2 - 26;
    const r = radius * scale.current;
    const projection = geoOrthographic()
      .precision(0.4)
      .rotate(rotate.current)
      .translate([w / 2, h / 2])
      .scale(r);
    const path = geoPath(projection);

    [seaRef, rimRef, shadeRef].forEach((ref) => {
      ref.current?.setAttribute("cx", String(w / 2));
      ref.current?.setAttribute("cy", String(h / 2));
      ref.current?.setAttribute("r", String(r));
    });
    gridRef.current?.setAttribute("d", path(geoGraticule10()) ?? "");
    landRef.current?.setAttribute("d", path(world.land as never) ?? "");
    linesRef.current?.setAttribute("d", path(world.lines as never) ?? "");

    const center: [number, number] = [-rotate.current[0], -rotate.current[1]];

    // 航线：交给 d3 画成 LineString，它会自己按大圆弧重采样，
    // 转到背面的部分也自动裁掉——这正是不该自己算投影的地方。
    if (arcsRef.current) {
      arcsRef.current.setAttribute(
        "d",
        showArcs && flights
          ? path({
              type: "FeatureCollection",
              features: flights.routes.map((r) => ({
                type: "Feature",
                properties: {},
                geometry: { type: "LineString", coordinates: [r.from, r.to] },
              })),
            } as never) ?? ""
          : ""
      );
    }

    // 去过的地方。两种粒度：整片的省和国，或者一个个城市的小圈。
    // 新加坡不在整片那一层——110m 的国界数据略掉了太小的国家，它本来就有实心点。
    // 当前粒度下该显示的要素。不该显示的清空 d，节点留着不动——
    // 省得 React 反复建删，高亮状态也不会跟着丢。
    const shown = visited ? (grain === "region" ? visited.coarse : visited.fine).features : [];
    const live = new Set(shown.map((f) => f.properties.name));
    regionRefs.current.forEach((el, name) => {
      if (!live.has(name)) el.setAttribute("d", "");
    });
    shown.forEach((f) => {
      const el = regionRefs.current.get(f.properties.name);
      if (el) el.setAttribute("d", path(f as never) ?? "");
    });

    // 城市的空心圈：只在国家模式下画，城市模式下已经是整片轮廓了
    dots.forEach((d) => {
      const el = dotRefs.current.get(d.name);
      if (!el) return;
      const away = geoDistance(d.at, center);
      const p = projection(d.at);
      if (grain !== "region" || away > Math.PI / 2 || !p) {
        el.setAttribute("display", "none");
        return;
      }
      el.removeAttribute("display");
      el.setAttribute("transform", `translate(${p[0].toFixed(1)} ${p[1].toFixed(1)})`);
      el.setAttribute("opacity", Math.min(1, (Math.PI / 2 - away) / 0.25).toFixed(2));
    });

    // 有轨迹的那几座城市：实心点 + 常驻标签，可以点进去
    cities.forEach((city) => {
      const g = pins.current.get(city.id);
      if (!g) return;
      const away = geoDistance([city.lon, city.lat], center);
      if (away > Math.PI / 2) {
        g.setAttribute("display", "none");
        return;
      }
      g.removeAttribute("display");
      const point = projection([city.lon, city.lat]);
      if (!point) return;
      const [x, y] = point;
      const on = activeRef.current === city.id;
      // 快转到边缘时淡出，绕到背面的过程才不生硬
      g.setAttribute("opacity", Math.min(1, (Math.PI / 2 - away) / 0.25).toFixed(2));
      const dot = g.querySelector(".dot") as SVGCircleElement;
      const hit = g.querySelector(".hit") as SVGCircleElement;
      const label = g.lastElementChild as SVGTextElement;
      // 选中不换颜色，只是长大一点、白圈粗一点——两种红摆在一起反而分不清
      const baseR = 2.6 + Math.sqrt(city.n) * 0.5;
      const dotR = on ? baseR * 1.35 : baseR;
      dot.setAttribute("r", dotR.toFixed(1));
      dot.setAttribute("stroke-width", on ? "2" : "1.2");
      const side = label.getAttribute("text-anchor") === "end" ? -1 : 1;
      dot.setAttribute("cx", x.toFixed(1));
      dot.setAttribute("cy", y.toFixed(1));
      hit.setAttribute("cx", x.toFixed(1));
      hit.setAttribute("cy", y.toFixed(1));
      hit.setAttribute("r", Math.max(dotR + 4, 8).toFixed(1));
      label.setAttribute("x", (x + side * (dotR + 5)).toFixed(1));
      label.setAttribute("y", (y + 4).toFixed(1));
      label.setAttribute("class", on ? "globe-label on" : "globe-label");
    });
  }, [cities, world, flights, visited, showArcs, grain, dots]);

  // 尺寸变了要重画；容器是先 0 再长起来的，所以得盯着
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      size.current = { w: el.clientWidth, h: el.clientHeight };
      svg.current?.setAttribute("viewBox", `0 0 ${el.clientWidth} ${el.clientHeight}`);
      draw();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [draw]);

  useEffect(draw, [draw, active]);

  // 手势跟城市地图保持一致：捏合缩放、双指滑动转动。
  // 必须自己挂且 passive:false——React 的 onWheel 是被动挂在根节点上的，
  // 里面调 preventDefault 不生效，捏合会被浏览器拿去缩放整个页面。
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        // 跟城市地图同一个手感：那边是 zoom += -deltaY × PINCH_PER_PX，
        // 而缩放级差一级就是两倍，所以这里换算成 2 的幂，速率才对得上。
        const factor = Math.pow(2, -e.deltaY * PINCH_PER_PX);
        scale.current = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale.current * factor));
      } else {
        // 双指滑动：地图那边是平移，球这边对应的就是转
        const k = 0.18 / scale.current;
        rotate.current = [
          rotate.current[0] - e.deltaX * k,
          Math.max(-90, Math.min(90, rotate.current[1] + e.deltaY * k)),
        ];
      }
      draw();
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [draw]);

  // 空闲时缓慢自转
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      if (spin.current && !drag.current) {
        rotate.current = [rotate.current[0] - dt * SPIN_PER_MS, rotate.current[1]];
        draw();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [draw]);

  /** 转到某座城市，走最短的那条弧 */
  const flyTo = useCallback(
    (id: string) => {
      const city = cities.find((c) => c.id === id);
      if (!city) return;
      setSpinning(false);
      const from = rotate.current;
      let dLon = -city.lon - from[0];
      while (dLon > 180) dLon -= 360;
      while (dLon < -180) dLon += 360;
      const dLat = -city.lat - from[1];
      const start = performance.now();
      const step = (now: number) => {
        const k = Math.min(1, (now - start) / 600);
        const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        rotate.current = [from[0] + dLon * e, from[1] + dLat * e];
        draw();
        if (k < 1) requestAnimationFrame(step);
        else handlers.current.onPick(id);
      };
      requestAnimationFrame(step);
    },
    [cities, draw]
  );

  // 两种粒度的要素都建好节点，切换时只是清空或写回 d。
  // 同一个地方两层可能都有（只知道去过南非的话，细粒度下也只能画整个国家），
  // 按名字去重，否则 React 会抱怨 key 重复。
  const regions = visited
    ? [
        ...new Map(
          [...visited.coarse.features, ...visited.fine.features].map((f) => [
            f.properties.name,
            f,
          ])
        ).values(),
      ]
    : [];

  // 杭州和安吉在球面上也就差两三个像素。两件事要处理：
  //   标签——都朝右会叠在一起，所以轨迹多的留在右边，挨着它的甩到左边；
  //   叠放——大的画在上面。反过来的话，你看到的是杭州那个大红点，
  //         点下去却进了盖在它中心上的安吉。安吉放大之后就分开了，
  //         右边的卡片也能直接进。
  const placed: RouteCity[] = [];
  const bySize = [...cities].sort((a, b) => b.n - a.n);
  const labelSide = new Map<string, "start" | "end">();
  bySize.forEach((city) => {
    const crowded = placed.some(
      (o) => Math.abs(o.lat - city.lat) < 3 && Math.abs(o.lon - city.lon) < 3
    );
    placed.push(city);
    labelSide.set(city.id, crowded ? "end" : "start");
  });
  const ordered = [...bySize].reverse();

  return (
    <div className="relative flex-1 min-h-0">
      <div
        ref={box}
        onPointerDown={(e) => {
          if ((e.target as Element).closest("button")) return;
          drag.current = { x: e.clientX, y: e.clientY, r: [...rotate.current] };
          dragged.current = false;
          setSpinning(false);
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d) return;
          if (!dragged.current && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 4) return;
          dragged.current = true;
          // 放大之后转慢一点，好控制
          const k = 0.25 / scale.current;
          rotate.current = [
            d.r[0] + (e.clientX - d.x) * k,
            Math.max(-90, Math.min(90, d.r[1] - (e.clientY - d.y) * k)),
          ];
          draw();
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerLeave={() => {
          drag.current = null;
        }}
        className={`absolute inset-0 rounded-md border border-gray-200 bg-white ${
          drag.current ? "cursor-grabbing" : "cursor-grab"
        }`}
      >
        <svg ref={svg} className="block h-full w-full">
          <defs>
            {/* 海：灰里掺一点蓝，看得出是海但不到「蓝色」。带明暗渐变，
                球才不像一个平的圆盘。整个球压得很淡，让海岸线的红出来说话。 */}
            <radialGradient id="globe-ocean" cx="34%" cy="28%" r="78%">
              <stop offset="0%" stopColor="#f7fafb" />
              <stop offset="55%" stopColor="#ecf1f4" />
              <stop offset="100%" stopColor="#dae2e8" />
            </radialGradient>
            {/* 压在最上层的球面阴影：左上留高光，右下沉下去 */}
            <radialGradient id="globe-shade" cx="32%" cy="26%" r="80%">
              <stop offset="0%" stopColor="#fff" stopOpacity="0.5" />
              <stop offset="45%" stopColor="#fff" stopOpacity="0" />
              <stop offset="100%" stopColor="#3a4e5a" stopOpacity="0.22" />
            </radialGradient>
          </defs>

          <circle
            ref={seaRef}
            fill="url(#globe-ocean)"
            // 两层投影：一层大而散托住整个球，一层紧贴球缘给它厚度。
            // 只用一层的话，要么太淡没存在感，要么糊成一片灰
            style={{
              filter:
                "drop-shadow(0 16px 40px rgba(45,70,92,0.20)) " +
                "drop-shadow(0 3px 10px rgba(45,70,92,0.10))",
            }}
          />
          {/* 经纬网画在陆地下面，只在海上看得见，画面才不吵 */}
          <path ref={gridRef} fill="none" stroke="#dfe5e9" strokeWidth={0.4} opacity={0.9} />
          {/* 陆地比海亮，反过来会糊成一片。海岸线用主色的淡版描——
              红色从城市点一直延伸到轮廓上，球才像一件作品而不是一张工具地图。 */}
          <path ref={landRef} fill="#fffdfd" stroke="#e5c2c4" strokeWidth={0.5} />
          {/* 九段线：只描线不填充，压在陆地之上 */}
          <path ref={linesRef} fill="none" stroke="#d09a9e" strokeWidth={0.9} strokeLinecap="round" />
          {/* 去过的省和国家：淡淡一层主色，压在陆地之上、航线和城市点之下。
              一个要素一个 path，才能各自响应悬停 */}
          <g>
            {regions.map((f) => {
              const label = lang === "zh" ? f.properties.zh : f.properties.en;
              const on = over?.label === label;
              return (
                <path
                  key={f.properties.name}
                  ref={(el) => {
                    if (el) regionRefs.current.set(f.properties.name, el);
                    else regionRefs.current.delete(f.properties.name);
                  }}
                  fill="#b12b32"
                  fillOpacity={on ? 0.3 : 0.13}
                  stroke={on ? "#b12b32" : "#cf9a9e"}
                  strokeWidth={on ? 0.7 : 0.35}
                  fillRule="evenodd"
                  className="cursor-default transition-[fill-opacity]"
                  onMouseMove={(e) => {
                    const box = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
                    if (box) setOver({ label, x: e.clientX - box.left, y: e.clientY - box.top });
                  }}
                  onMouseLeave={() => setOver(null)}
                />
              );
            })}
          </g>

          {/* 国家模式下的城市：空心圈，鼠标移上去显示名字 */}
          <g>
            {dots.map((d) => {
              const label = lang === "zh" ? d.zh : d.en;
              const on = over?.label === label;
              return (
                <g
                  key={d.name}
                  ref={(el) => {
                    if (el) dotRefs.current.set(d.name, el);
                    else dotRefs.current.delete(d.name);
                  }}
                  display="none"
                  className="cursor-default"
                  onMouseMove={(e) => {
                    const box = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
                    if (box) setOver({ label, x: e.clientX - box.left, y: e.clientY - box.top });
                  }}
                  onMouseLeave={() => setOver(null)}
                >
                  <circle r={8} fill="transparent" />
                  {/* 小实心点，比有轨迹的那几座浅一档：同一种语言的两个层级。
                      空心圈在这个尺寸下只有两三个像素，读起来像噪点 */}
                  <circle
                    r={on ? 3.4 : 2}
                    fill={on ? "#b12b32" : "#c8797e"}
                    stroke="#fff"
                    strokeWidth={on ? 1.2 : 0.6}
                  />
                </g>
              );
            })}
          </g>

          <path ref={arcsRef} fill="none" stroke="#b12b32" strokeWidth={0.7} opacity={0.3} />
          <circle ref={shadeRef} fill="url(#globe-shade)" className="pointer-events-none" />
          <circle ref={rimRef} fill="none" stroke="#cfc5c6" strokeWidth={0.8} opacity={0.8} />

          {ordered.map((city) => (
              <g
                key={city.id}
                ref={(el) => {
                  if (el) pins.current.set(city.id, el);
                  else pins.current.delete(city.id);
                }}
                className="cursor-pointer"
                onMouseEnter={() => {
                  handlers.current.onHover(city.id);
                  setSpinning(false);
                }}
                onMouseLeave={() => handlers.current.onHover(null)}
                onClick={() => {
                  // 拖动结束时浏览器会补一个 click，那一下要吞掉
                  if (dragged.current) {
                    dragged.current = false;
                    return;
                  }
                  flyTo(city.id);
                }}
              >
                {/* 看不见的命中区。可见的点只有几个像素，光靠它太难点中；
                    大点的城市命中区也大，所以杭州能盖住挨着它的安吉那一圈之外的地方 */}
                <circle className="hit" fill="transparent" />
                <circle
                  className="dot"
                  r={2.6 + Math.sqrt(city.n) * 0.5}
                  stroke="#fff"
                  strokeWidth={1.2}
                  fill="#b12b32"
                />
                <text className="globe-label" textAnchor={labelSide.get(city.id)}>
                  {lang === "zh" ? city.zh : city.en}
                </text>
              </g>
          ))}
          {/* 悬停时的名字。画在最后，压在所有东西之上 */}
          {over && (
            <text
              className="globe-label pointer-events-none"
              x={over.x + 10}
              y={over.y - 6}
              style={{ fontWeight: 600 }}
            >
              {over.label}
            </text>
          )}
        </svg>
        {loadError && (
          <div className="absolute inset-0 flex items-center justify-center rounded-md bg-white/90 px-6 text-center">
            <div>
              <p className="text-sm font-medium text-gray-700">{t("worldLoadError")}</p>
              <button
                type="button"
                onClick={() => setLoadToken((n) => n + 1)}
                className="mt-3 rounded-full border border-primary px-4 py-1.5 text-sm text-primary hover:bg-red-50"
              >
                {t("retry")}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 缩放按钮。触控板捏合当然也行，但鼠标用户没有捏合这个手势，
          而且有明确的按钮，第一次进来才知道这球是能放大的。 */}
      <div className="absolute left-2 top-2 z-10 flex flex-col overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm sm:left-3 sm:top-3">
        {[
          { label: "+", by: 1.5, title: t("zoomIn") },
          { label: "−", by: 1 / 1.5, title: t("zoomOut") },
        ].map((o, i) => (
          <button
            key={o.label}
            type="button"
            title={o.title}
            aria-label={o.title}
            onClick={() => {
              scale.current = Math.max(
                MIN_SCALE,
                Math.min(MAX_SCALE, scale.current * o.by)
              );
              draw();
            }}
            className={`h-9 w-9 text-[15px] leading-none text-gray-500 transition-colors hover:bg-gray-50 hover:text-primary sm:h-7 sm:w-7 ${
              i > 0 ? "border-t border-gray-200" : ""
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      <div className="absolute left-12 right-2 top-2 z-10 flex flex-wrap justify-end gap-1 sm:left-auto sm:right-3 sm:top-3 sm:gap-2">
        {/* 去过的地方看到哪一级 */}
        <div className="flex overflow-hidden rounded-full border border-gray-200 bg-white shadow-sm">
          {([
            { id: "region" as const, label: t("byRegion") },
            { id: "city" as const, label: t("byCity") },
          ]).map((o, i) => (
            <button
              key={o.id}
              type="button"
              onClick={() => setGrain(o.id)}
              aria-pressed={grain === o.id}
              className={`min-h-9 px-2.5 py-1 text-[11.5px] transition-colors sm:min-h-0 sm:px-3 sm:text-[12.5px] ${i > 0 ? "border-l border-gray-200" : ""} ${
                grain === o.id ? "bg-primary text-white" : "text-gray-500 hover:text-primary"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowArcs((on) => !on)}
          aria-pressed={showArcs}
          className={`min-h-9 rounded-full border px-2.5 py-1 text-[11.5px] shadow-sm transition-colors sm:min-h-0 sm:px-3 sm:text-[12.5px] ${
            showArcs
              ? "border-primary bg-primary text-white"
              : "border-gray-200 bg-white text-gray-500 hover:border-primary hover:text-primary"
          }`}
        >
          {t("flightPaths")}
        </button>
        <button
          type="button"
          onClick={() => setSpinning((on) => !on)}
          className="min-h-9 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11.5px] text-gray-500 shadow-sm transition-colors hover:border-primary hover:text-primary sm:min-h-0 sm:px-3 sm:text-[12.5px]"
        >
          {t("spin")} <span className="text-[11px]">{spinning ? "⏸" : "▶"}</span>
        </button>
        <button
          type="button"
          onClick={() => {
            rotate.current = [...HOME];
            scale.current = 1;
            setSpinning(true);
            draw();
          }}
          className="min-h-9 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11.5px] text-gray-500 shadow-sm transition-colors hover:border-primary hover:text-primary sm:min-h-0 sm:px-3 sm:text-[12.5px]"
        >
          {t("fitAll")}
        </button>
      </div>
    </div>
  );
}
