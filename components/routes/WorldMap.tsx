"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import type { RouteCity } from "@/lib/routes";
import { useLang } from "@/lib/life-i18n";
import { useLeafletMap } from "./useLeafletMap";

/**
 * 一级页的世界地图：城市按经纬度落在真实底图上，点一个进那座城市。
 *
 * 跟城市层用的是同一套地图，所以手势、取景、框的尺寸都不用各写一遍。
 * 杭州和安吉在世界尺度下几乎重叠——不做落点避让，放大就能分开，
 * 这本来就是地图该有的解法。
 */
export default function WorldMap({
  cities,
  active,
  onHover,
  onPick,
  fitToken,
  children,
}: {
  cities: RouteCity[];
  active: string | null;
  onHover: (id: string | null) => void;
  onPick: (id: string) => void;
  fitToken: number;
  children?: React.ReactNode;
}) {
  const lang = useLang();
  // minZoom 1：整个地球正好装进这个框，缩到底就能看见全部
  const { box, layer, fitTo } = useLeafletMap({ minZoom: 1, world: true });
  const dots = useRef(new Map<string, L.CircleMarker>());

  // 最新的回调放进 ref，事件处理器就不用跟着重新绑定
  const handlers = useRef({ onHover, onPick });
  handlers.current = { onHover, onPick };

  // 默认就给整个地球，而不是框住那几座城市——这一层的意思是「都去过哪儿」，
  // 一上来贴着东亚放大反而看不出它们在世界上的位置。
  //
  // 纬度收到 -55…72 是有讲究的：取满两极的话 fitBounds 会变成高度受限，
  // 缩得更小、左右反而空出一大截。收窄之后变成宽度受限，横向正好撑满，
  // 上下由墨卡托自己铺到 ±85，看不到白边。
  const frame = () =>
    L.latLngBounds([
      [-55, -180],
      [72, 180],
    ]);

  useEffect(() => {
    const g = layer.current;
    if (!g) return;
    g.clearLayers();
    dots.current.clear();

    // 杭州和安吉只差 0.35 个经度，标签都朝右会叠在一起。挨得太近的那个
    // （轨迹少的那个）把标签甩到左边去——比做一整套避让省事，效果也够。
    const placed: RouteCity[] = [];
    const sideOf = (city: RouteCity) => {
      const crowded = placed.some(
        (other) => Math.abs(other.lat - city.lat) < 2 && Math.abs(other.lon - city.lon) < 2
      );
      placed.push(city);
      return crowded ? ("left" as const) : ("right" as const);
    };

    [...cities]
      .sort((a, b) => b.n - a.n)
      .forEach((city) => {
      const side = sideOf(city);
      const marker = L.circleMarker([city.lat, city.lon], {
        // 半径按条数开方，差别读得出来又不至于糊成一团。
        // 这一层是索引不是图表，点小一些，地图本身才是主角。
        radius: 2.6 + Math.sqrt(city.n) * 0.5,
        color: "#fff",
        weight: 1,
        fillColor: "#a89f92",
        fillOpacity: 1,
      })
        .bindTooltip(lang === "zh" ? city.zh : city.en, {
          permanent: true,
          direction: side,
          offset: [side === "right" ? 5 : -5, 0],
          className: "routes-pin",
        })
        .on("mouseover", () => handlers.current.onHover(city.id))
        .on("mouseout", () => handlers.current.onHover(null))
        .on("click", () => handlers.current.onPick(city.id));
      marker.addTo(g);
      dots.current.set(city.id, marker);
    });

    fitTo(frame(), [14, 14]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cities, lang, layer, fitTo]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    if (fitToken) fitTo(frame(), [14, 14]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitToken, fitTo]);

  // 高亮只改样式，不重画——重画会在 mousedown 和 mouseup 之间换掉元素，click 就丢了
  useEffect(() => {
    dots.current.forEach((marker, id) => {
      const on = id === active;
      marker.setStyle({ fillColor: on ? "#b12b32" : "#a89f92" });
      marker.getTooltip()?.getElement()?.classList.toggle("on", on);
      if (on) marker.bringToFront();
    });
  }, [active]);

  return (
    <div className="relative flex-1 min-h-0">
      <div ref={box} className="absolute inset-0 rounded-md border border-gray-200" />
      {children}
    </div>
  );
}
