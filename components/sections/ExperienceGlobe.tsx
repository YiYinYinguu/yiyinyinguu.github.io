"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { geoDistance, geoGraticule10, geoOrthographic, geoPath } from "d3-geo";

type Item = { location: string; coords?: [number, number] };
type Stop = { city: string; lon: number; lat: number };

type Collection = { type: "FeatureCollection"; features: unknown[] };
/** 跟 Routes 的地球共用 public/routes/land.json：land 是陆地，lines 是九段线 */
type World = { land: Collection; lines: Collection };

// 转到当前那座城时纬度只跟一部分：整跟的话球会上下猛甩，
// 完全不跟又看不出维也纳在北、新加坡在赤道上。
const TILT = 0.55;
// 缓动时间常数（毫秒）。滚动是连续的，球得比滚动懒一点才不像跟着抽搐。
const TAU = 320;
// 差这么点就算到位了，省得永远差一丝丝、rAF 停不下来
const SETTLED = 0.05;

/** 城市名就是联动的键：球上的点和下面的条目靠它对上。 */
export function cityOf(location: string) {
  return location.split(",")[0].trim();
}

/** 同一个城市去过好几次的只画一个点。 */
function stopsOf(items: Item[]): Stop[] {
  const stops: Stop[] = [];
  items.forEach((item) => {
    if (!item.coords) return;
    const city = cityOf(item.location);
    if (!stops.some((s) => s.city === city)) {
      stops.push({ city, lon: item.coords[0], lat: item.coords[1] });
    }
  });
  return stops;
}

// 球径占较短那一边的比例。吃满的话球顶球底都顶到列表的上下边，太满了，
// 收下来才像垫在文字底下的一块底图，而不是一个要挤出去的东西。
const FILL = 0.7;

/** 球心和半径：整块列表的正中。 */
function layout(w: number, h: number) {
  return { cx: w / 2, cy: h / 2, r: (Math.min(w, h) / 2 - 10) * FILL };
}

/**
 * 垫在 Experience 条目底下的地球：滚到哪一条，球就转到那座城。
 *
 * 投影用 d3-geo（背面裁切是这类投影最容易写错的地方），每帧只改属性、
 * 不动节点——理由和 Routes 那颗球一样，见 components/routes/Globe.tsx。
 * 这颗是背景，所以没有拖拽、缩放、自转按钮：唯一的输入是你滚到了哪儿。
 */
export default function ExperienceGlobe({
  items,
  active,
}: {
  items: Item[];
  active: string | null;
}) {
  const box = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const seaRef = useRef<SVGCircleElement>(null);
  const rimRef = useRef<SVGCircleElement>(null);
  const gridRef = useRef<SVGPathElement>(null);
  const landRef = useRef<SVGPathElement>(null);
  const linesRef = useRef<SVGPathElement>(null);
  const pins = useRef(new Map<string, SVGGElement>());

  const [world, setWorld] = useState<World | null>(null);

  const stops = stopsOf(items);
  // 一进来就朝着第一条经历，而不是从大西洋慢慢转过去
  const first = stops[0];
  const rotate = useRef<[number, number]>(
    first ? [-first.lon, -first.lat * TILT] : [-105, -18]
  );
  const target = useRef<[number, number]>([...rotate.current]);
  const size = useRef({ w: 0, h: 0 });
  const raf = useRef(0);
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
    if (!w || !h || !world) return;

    const { cx, cy, r } = layout(w, h);
    const projection = geoOrthographic()
      .precision(0.4)
      .rotate(rotate.current)
      .translate([cx, cy])
      .scale(r);
    const path = geoPath(projection);

    [seaRef, rimRef].forEach((ref) => {
      ref.current?.setAttribute("cx", String(cx));
      ref.current?.setAttribute("cy", String(cy));
      ref.current?.setAttribute("r", String(r));
    });
    gridRef.current?.setAttribute("d", path(geoGraticule10()) ?? "");
    landRef.current?.setAttribute("d", path(world.land as never) ?? "");
    linesRef.current?.setAttribute("d", path(world.lines as never) ?? "");

    const center: [number, number] = [-rotate.current[0], -rotate.current[1]];
    stops.forEach((stop) => {
      const g = pins.current.get(stop.city);
      if (!g) return;
      const away = geoDistance([stop.lon, stop.lat], center);
      if (away > Math.PI / 2) {
        // display:none 而不是 opacity:0——连线要靠 getBoundingClientRect
        // 判断这个点在不在正面，透明的点量出来仍然是有尺寸的
        g.setAttribute("display", "none");
        return;
      }
      g.removeAttribute("display");
      const point = projection([stop.lon, stop.lat]);
      if (!point) return;
      const [x, y] = point;
      const on = activeRef.current === stop.city;
      // 转到边缘时淡出，绕到背面的过程才不生硬
      g.setAttribute("opacity", Math.min(1, (Math.PI / 2 - away) / 0.25).toFixed(2));
      const dot = g.firstElementChild as SVGCircleElement;
      const label = g.lastElementChild as SVGTextElement;
      const dotR = on ? 8 : 5;
      dot.setAttribute("r", String(dotR));
      dot.setAttribute("cx", x.toFixed(1));
      dot.setAttribute("cy", y.toFixed(1));
      dot.setAttribute("stroke-width", on ? "2" : "1.2");
      // 只给当前那座城写名字：六个名字常驻会跟正文抢注意力。
      // 名字写在点的左边：虚线是从右边的条目拉过来的，名字放右边会被它穿过去
      label.setAttribute("x", (x - dotR - 5).toFixed(1));
      label.setAttribute("y", (y + 4).toFixed(1));
      label.setAttribute("class", on ? "globe-label on" : "globe-label");
      label.setAttribute("opacity", on ? "1" : "0");
    });
  }, [stops, world]);

  /** 让球朝 target 缓过去。到位就停，不空转 rAF。 */
  const settle = useCallback(() => {
    if (raf.current) return;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      // 经度是圆的：从维也纳到新加坡该往东转 87°，不是往西转 273°
      let dLon = target.current[0] - rotate.current[0];
      while (dLon > 180) dLon -= 360;
      while (dLon < -180) dLon += 360;
      const dLat = target.current[1] - rotate.current[1];
      // 指数缓动，跟帧率无关：掉帧时步子自动变大，不会慢半拍
      const k = 1 - Math.exp(-dt / TAU);
      rotate.current = [rotate.current[0] + dLon * k, rotate.current[1] + dLat * k];
      draw();
      if (Math.abs(dLon) < SETTLED && Math.abs(dLat) < SETTLED) {
        rotate.current = [...target.current];
        draw();
        raf.current = 0;
        return;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }, [draw]);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  // active 变了就换目标。系统开了「减弱动态效果」的话直接跳过去——
  // 一个人是因为动画不舒服才开的这个开关，背景更没理由动。
  useEffect(() => {
    const stop = stops.find((s) => s.city === active);
    if (!stop) return draw();
    target.current = [-stop.lon, -stop.lat * TILT];
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      rotate.current = [...target.current];
      draw();
      return;
    }
    settle();
  }, [active, draw, settle, stops]);

  // 容器是先 0 再长起来的，所以尺寸得盯着
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

  useEffect(draw, [draw]);

  if (stops.length === 0) return null;

  return (
    // 整层不接收鼠标，否则会挡住下面条目的悬停
    <div ref={box} className="absolute inset-0 opacity-[0.55] pointer-events-none select-none">
      <svg ref={svg} className="block h-full w-full overflow-visible">
        {/* 海是一个平色圆盘。Routes 那颗球有明暗渐变，因为它是主角、要能拖着转，
            得像个实体；这颗垫在六行文字底下，一有体积感眼睛就先看球再看字。 */}
        <circle ref={seaRef} fill="#eaeff2" />
        {/* 经纬网画在陆地下面，只在海上看得见，画面才不吵 */}
        <path ref={gridRef} fill="none" stroke="#dfe5e9" strokeWidth={0.4} opacity={0.9} />
        {/* Routes 那颗球用主色的淡版描海岸线——那是页面主角，红是它的说话方式。
            这颗是垫在正文底下的背景，海岸线一红就跟条目抢注意力，所以全部走中性灰，
            球上唯一的红留给城市点。 */}
        <path ref={landRef} fill="#fffdfd" stroke="#dfe5e9" strokeWidth={0.5} />
        <path ref={linesRef} fill="none" stroke="#d3dbe1" strokeWidth={0.9} strokeLinecap="round" />
        <circle ref={rimRef} fill="none" stroke="#cfc5c6" strokeWidth={0.8} opacity={0.8} />

        {stops.map((stop) => (
          <g
            key={stop.city}
            ref={(el) => {
              if (el) pins.current.set(stop.city, el);
              else pins.current.delete(stop.city);
            }}
          >
            {/* data-pin 打在圆点上而不是整组上：连线量的是这个属性的包围盒，
                打在组上的话盒子里连城市名一起算，线会歪到名字那边去 */}
            <circle data-pin={stop.city} stroke="#fff" strokeWidth={1.2} fill="#b12b32" />
            <text className="globe-label" textAnchor="end">
              {stop.city}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
