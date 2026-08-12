"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { PINCH_PER_PX } from "./shared";

/**
 * 世界层和城市层共用的那张 Leaflet 地图。
 *
 * 两层用同一套东西，手势、取景、容器尺寸的处理就只有一份，
 * 框的大小也天然一致——之前世界层是手画的 svg，光是让两层一样高就改了好几轮。
 */
export function useLeafletMap(options?: { minZoom?: number; world?: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  // ref 写入不会触发调用方重渲染。城市路线可能比 Leaflet 更早到货，
  // 必须用 state 明确通知「地图和图层都已就绪」，否则那次画线会被永久错过。
  const [ready, setReady] = useState(false);
  /** 容器尺寸还没稳定时反复用的取景范围。用户一动手就置空，之后不再自动取景 */
  const wanted = useRef<{ b: L.LatLngBounds; p: L.PointTuple } | null>(null);

  useEffect(() => {
    if (!box.current || map.current) return;

    const m = L.map(box.current, {
      attributionControl: false,
      minZoom: options?.minZoom ?? 2,
      // zoomSnap 默认是 1，fitBounds 只能落在整数级别，装不下就退一级，
      // 画面常常浪费一半。改成 0 允许小数级缩放，内容才能真的贴着框。
      zoomSnap: 0,
      zoomDelta: 0.5,
    });
    // 世界层用不带地名的底图：那一层该有名字的只有她自己去过的城市，
    // 满屏的「KYRGYZSTAN」是噪音。城市层反过来，路名地名正是要看的东西。
    const world = options?.world ?? false;
    L.tileLayer(
      `https://{s}.basemaps.cartocdn.com/${world ? "light_nolabels" : "light_all"}/{z}/{x}/{y}{r}.png`,
      {
        maxZoom: 19,
        attribution: "© OpenStreetMap, © CARTO",
        // 世界层不横向重复，否则缩到最小会看到好几个地球排成一排
        noWrap: world,
      }
    ).addTo(m);
    if (world) {
      m.setMaxBounds([
        [-85, -180],
        [85, 180],
      ]);
    }
    L.control.attribution({ prefix: false, position: "bottomright" }).addTo(m);

    // 容器是先 0 再长到最终高度的，第一次 fitBounds 常按半大的尺寸算完，
    // 之后容器长大画面就相对缩水、还偏向一边。所以尺寸每变一次都重新贴合。
    const observer = new ResizeObserver(() => {
      m.invalidateSize();
      if (wanted.current) {
        m.fitBounds(wanted.current.b, { padding: wanted.current.p, animate: false });
      }
    });
    observer.observe(box.current);

    const release = () => {
      wanted.current = null;
    };
    m.on("dragstart zoomstart movestart", release);

    // Leaflet 自带的滚轮缩放会攒 40ms 防抖再走一段缩放动画。触控板连续输出小增量时
    // 动画不断被打断重启，净位移很小——灵敏度参数调到头也救不回来。所以关掉它，
    // 自己直接响应每一个事件。手势分工按地图软件的惯例：捏合缩放，双指滑动平移。
    //
    // 必须自己 addEventListener 并且 passive:false：React 的 onWheel 是被动挂在
    // 根节点上的，里面调 preventDefault 不生效，捏合会被浏览器拿去缩放整个页面。
    m.scrollWheelZoom.disable();
    const element = m.getContainer();
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      release();
      if (e.ctrlKey || e.metaKey) {
        const dz = -e.deltaY * PINCH_PER_PX;
        m.setZoomAround(m.mouseEventToContainerPoint(e), m.getZoom() + dz, { animate: false });
      } else {
        m.panBy([e.deltaX, e.deltaY], { animate: false });
      }
    };
    element.addEventListener("wheel", onWheel, { passive: false });

    map.current = m;
    layer.current = L.layerGroup().addTo(m);
    setReady(true);

    return () => {
      observer.disconnect();
      element.removeEventListener("wheel", onWheel);
      m.remove();
      map.current = null;
      layer.current = null;
      setReady(false);
    };
    // options 只在挂载时读一次，改它不该导致地图重建
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** 把画面框到这个范围。记下来，容器尺寸稳定之前会被反复应用。 */
  const fitTo = useCallback((bounds: L.LatLngBounds | null, padding: L.PointTuple) => {
    const m = map.current;
    if (!m || !bounds?.isValid()) return;
    wanted.current = { b: bounds, p: padding };
    m.invalidateSize();
    m.fitBounds(bounds, { padding, animate: false });
  }, []);

  return { box, map, layer, fitTo, ready };
}
