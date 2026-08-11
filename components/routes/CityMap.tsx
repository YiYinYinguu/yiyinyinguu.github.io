"use client";

import { useCallback, useEffect, useRef } from "react";
import L from "leaflet";
import type { Track } from "@/lib/routes";
import { color, fmtDate } from "./shared";
import { useLeafletMap } from "./useLeafletMap";

type Props = {
  /** 当前要画的路线，已经按类型和年份筛过 */
  tracks: Track[];
  /** 短于这个里程的画成浅色底子，不可点 */
  minKm: number;
  /** 只看某一条时传它；同城其余路线淡化成参照 */
  focus?: Track | null;
  /** focus 模式下当参照的那一堆 */
  context?: Track[];
  hot: string | null;
  onHot: (id: string | null) => void;
  onPick: (track: Track) => void;
  /** 类型的显示名，中英文由外面决定 */
  kindLabel: (kind: string) => string;
  /** 变了就重新取景：换城市、换路线、改筛选都会让它变 */
  fitKey: string;
  /** 「全览」按钮：变一次就把画面拉回当前这层的范围 */
  fitToken: number;
  children?: React.ReactNode;
};

export default function CityMap({
  tracks,
  minKm,
  focus,
  context,
  hot,
  onHot,
  onPick,
  kindLabel,
  fitKey,
  fitToken,
  children,
}: Props) {
  const { box, map, layer, fitTo } = useLeafletMap();
  const lines = useRef(new Map<string, L.Polyline>());
  // 最新的回调放进 ref，这样地图上的事件处理器不用跟着重新绑定。
  // kindLabel 也在里面：它每次渲染都是个新函数，进了依赖就会让画线的 effect
  // 跟着重跑——鼠标划过地图触发一次高亮，画面就会被重新取景拉回去。
  const handlers = useRef({ onHot, onPick, kindLabel });
  handlers.current = { onHot, onPick, kindLabel };

  /** 画完线之后算出来的取景范围 */
  const bounds = useRef<L.LatLngBounds | null>(null);
  const pad = useRef<[number, number]>([24, 24]);
  /** 已经为哪个 fitKey 取过景了。轨迹是异步取的，第一次画线时往往还没到货，
      算不出范围也就取不了景；等数据到了要认得出「这一层还没取过景」。 */
  const fitted = useRef<string | null>(null);

  const applyFit = useCallback(() => {
    fitTo(bounds.current, pad.current);
  }, [fitTo]);

  // 画线。focus 有值时只突出那一条，其余淡成参照
  useEffect(() => {
    const m = map.current;
    const g = layer.current;
    if (!m || !g) return;

    g.clearLayers();
    lines.current.clear();

    if (focus) {
      (context ?? []).forEach((t) => {
        if (t.id === focus.id) return;
        L.polyline(t.p, {
          color: "#9ca3af",
          weight: 1.2,
          opacity: 0.33,
          interactive: false,
          smoothFactor: 1,
        }).addTo(g);
      });
      const c = color(focus.k);
      const main = L.polyline(focus.p, { color: c, weight: 4, opacity: 0.95, smoothFactor: 1 }).addTo(g);
      const a = focus.p[0];
      const z = focus.p[focus.p.length - 1];
      L.circleMarker(a, { radius: 5, color: c, weight: 2.5, fillColor: "#fff", fillOpacity: 1 }).addTo(g);
      L.circleMarker(z, { radius: 5, color: c, weight: 2.5, fillColor: c, fillOpacity: 1 }).addTo(g);
      bounds.current = main.getBounds();
      pad.current = [46, 46];
    } else {
      // 短途先画，压在底下
      tracks
        .filter((t) => t.km < minKm)
        .forEach((t) => {
          L.polyline(t.p, {
            color: color(t.k),
            weight: 1.8,
            opacity: 0.45,
            interactive: false,
            smoothFactor: 1,
          }).addTo(g);
        });
      const main = tracks.filter((t) => t.km >= minKm);
      main.forEach((t) => {
        const line = L.polyline(t.p, {
          color: color(t.k),
          weight: 2.4,
          opacity: 0.62,
          smoothFactor: 1,
        }).bindTooltip(`${handlers.current.kindLabel(t.k)} · ${fmtDate(t.d)} · ${t.km.toFixed(2)} km`, {
          sticky: true,
        });
        line.on("mouseover", () => handlers.current.onHot(t.id));
        line.on("mouseout", () => handlers.current.onHot(null));
        line.on("click", () => handlers.current.onPick(t));
        line.addTo(g);
        lines.current.set(t.id, line);
      });

      // 按真正画出来的线取景，而不是整座城市的 bbox——
      // 筛掉一部分类型或年份之后，画面会跟着收紧。
      const drawn = g.getLayers().filter((l) => l instanceof L.Polyline) as L.Polyline[];
      bounds.current = drawn.length ? L.featureGroup(drawn).getBounds() : null;
      pad.current = [24, 24];
    }

    // 这一层还没取过景就现在取——不能只盯着 fitKey 变化，因为轨迹到货时
    // fitKey 早就定下来了，只等它变的话地图会一直停在没有视野的空白状态。
    if (fitted.current !== fitKey && bounds.current?.isValid()) {
      fitted.current = fitKey;
      applyFit();
    }
  }, [tracks, minKm, focus, context, fitKey, applyFit]);

  // 「全览」：把用户拖乱的画面拉回这一层该有的范围
  useEffect(() => {
    if (fitToken) applyFit();
  }, [fitToken, applyFit]);

  // 高亮只改样式，不重画——重画会在 mousedown 和 mouseup 之间换掉元素，click 就丢了
  useEffect(() => {
    lines.current.forEach((line, id) => {
      const on = id === hot;
      line.setStyle({ weight: on ? 5 : 2.4, opacity: on ? 1 : 0.62 });
      if (on) line.bringToFront();
    });
  }, [hot]);

  return (
    <div className="relative flex-1 min-h-0">
      <div ref={box} className="absolute inset-0 rounded-md border border-gray-200" />
      {children}
    </div>
  );
}
