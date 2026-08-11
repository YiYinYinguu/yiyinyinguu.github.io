"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { geoDistance, geoGraticule10, geoOrthographic, geoPath } from "d3-geo";
import type { RouteCity } from "@/lib/routes";
import { useLang, useT } from "@/lib/life-i18n";
import { PINCH_PER_PX } from "./shared";

/** 默认转到亚洲这一面——她去过的地方都在这儿 */
const HOME: [number, number] = [-105, -18];
const SPIN_PER_MS = 0.004;
const MIN_SCALE = 0.85;
const MAX_SCALE = 8;

type Collection = { type: "FeatureCollection"; features: unknown[] };
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
  const pins = useRef(new Map<string, SVGGElement>());

  const [world, setWorld] = useState<World | null>(null);
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
    fetch("/routes/land.json")
      .then((r) => r.json())
      .then((data) => alive && setWorld(data));
    return () => {
      alive = false;
    };
  }, []);

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
      const dot = g.firstElementChild as SVGCircleElement;
      const label = g.lastElementChild as SVGTextElement;
      // 选中不换颜色，只是长大一点、白圈粗一点——两种红摆在一起反而分不清
      const baseR = 2.6 + Math.sqrt(city.n) * 0.5;
      const dotR = on ? baseR * 1.35 : baseR;
      dot.setAttribute("r", dotR.toFixed(1));
      dot.setAttribute("stroke-width", on ? "2" : "1.2");
      const side = label.getAttribute("text-anchor") === "end" ? -1 : 1;
      dot.setAttribute("cx", x.toFixed(1));
      dot.setAttribute("cy", y.toFixed(1));
      label.setAttribute("x", (x + side * (dotR + 5)).toFixed(1));
      label.setAttribute("y", (y + 4).toFixed(1));
      label.setAttribute("class", on ? "globe-label on" : "globe-label");
    });
  }, [cities, world]);

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

  // 杭州和安吉在球面上也就差两三个像素，标签都朝右会叠在一起。
  // 轨迹多的留在右边，挨着它的甩到左边。
  const placed: RouteCity[] = [];
  const ordered = [...cities].sort((a, b) => b.n - a.n);

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
            style={{ filter: "drop-shadow(0 8px 22px rgba(60,80,95,0.14))" }}
          />
          {/* 经纬网画在陆地下面，只在海上看得见，画面才不吵 */}
          <path ref={gridRef} fill="none" stroke="#dfe5e9" strokeWidth={0.4} opacity={0.9} />
          {/* 陆地比海亮，反过来会糊成一片。海岸线用主色的淡版描——
              红色从城市点一直延伸到轮廓上，球才像一件作品而不是一张工具地图。 */}
          <path ref={landRef} fill="#fffdfd" stroke="#e5c2c4" strokeWidth={0.5} />
          {/* 九段线：只描线不填充，压在陆地之上 */}
          <path ref={linesRef} fill="none" stroke="#d09a9e" strokeWidth={0.9} strokeLinecap="round" />
          <circle ref={shadeRef} fill="url(#globe-shade)" className="pointer-events-none" />
          <circle ref={rimRef} fill="none" stroke="#cfc5c6" strokeWidth={0.8} opacity={0.8} />

          {ordered.map((city) => {
            const crowded = placed.some(
              (o) => Math.abs(o.lat - city.lat) < 3 && Math.abs(o.lon - city.lon) < 3
            );
            placed.push(city);
            return (
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
                <circle
                  r={2.6 + Math.sqrt(city.n) * 0.5}
                  stroke="#fff"
                  strokeWidth={1.2}
                  fill="#b12b32"
                />
                <text className="globe-label" textAnchor={crowded ? "end" : "start"}>
                  {lang === "zh" ? city.zh : city.en}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* 缩放按钮。触控板捏合当然也行，但鼠标用户没有捏合这个手势，
          而且有明确的按钮，第一次进来才知道这球是能放大的。 */}
      <div className="absolute left-3 top-3 z-10 flex flex-col overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm">
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
            className={`h-7 w-7 text-[15px] leading-none text-gray-500 transition-colors hover:bg-gray-50 hover:text-primary ${
              i > 0 ? "border-t border-gray-200" : ""
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      <div className="absolute right-3 top-3 z-10 flex gap-2">
        <button
          type="button"
          onClick={() => setSpinning((on) => !on)}
          className="rounded-full border border-gray-200 bg-white px-3 py-1 text-[12.5px] text-gray-500 shadow-sm transition-colors hover:border-primary hover:text-primary"
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
          className="rounded-full border border-gray-200 bg-white px-3 py-1 text-[12.5px] text-gray-500 shadow-sm transition-colors hover:border-primary hover:text-primary"
        >
          {t("fitAll")}
        </button>
      </div>
    </div>
  );
}
