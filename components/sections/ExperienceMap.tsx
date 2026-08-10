"use client";

// public/images/world.svg 是等距圆柱投影，南北极那片空海裁掉了。
// 这两个数要跟生成它的脚本一致，否则点会落偏。
const LAT_TOP = 80;
const LAT_BOTTOM = -58;

// 标签默认在点右边；挤在一起的城市手动挪开。
// 巴黎和维也纳只差 14 个经度，这个尺寸下不到 20px。
const LABEL_LEFT = new Set(["Paris"]);

type Item = { location: string; coords?: [number, number] };
type Stop = { city: string; lon: number; lat: number };

/** 城市名就是联动的键：地图上的点和下面的条目靠它对上。 */
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

function project(lon: number, lat: number) {
  return {
    x: ((lon + 180) / 360) * 100,
    y: ((LAT_TOP - lat) / (LAT_TOP - LAT_BOTTOM)) * 100,
  };
}

/**
 * 垫在 Experience 条目底下的世界地图。整张图垂直居中、不裁切，
 * 五个城市按经纬度落点；条目从上面盖过去，悬停时两边一起亮。
 */
export default function ExperienceMap({ items, active }: { items: Item[]; active: string | null }) {
  const stops = stopsOf(items);
  if (stops.length === 0) return null;

  return (
    // 整层不接收鼠标，只有点自己接收，否则会挡住下面条目的悬停
    <div className="absolute top-1/2 left-0 w-full -translate-y-1/2 opacity-60 pointer-events-none select-none">
      {/* 用 img 而不是内联：26KB 的路径数据不必进 HTML，浏览器还能单独缓存。
          代价是拿不到 currentColor，所以陆地颜色写在 svg 文件里。 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/world.svg" alt="" className="block w-full" />

      {stops.map((stop) => {
        const p = project(stop.lon, stop.lat);
        const on = active === stop.city;
        return (
          <span
            key={stop.city}
            data-pin={stop.city}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
          >
            <span
              className={`block w-[7px] h-[7px] rounded-full transition-all ${
                on ? "bg-primary ring-4 ring-primary/15" : "bg-gray-400"
              }`}
            />
            <span
              className={`absolute top-1/2 -translate-y-1/2 whitespace-nowrap text-[11px] transition-colors ${
                LABEL_LEFT.has(stop.city) ? "right-[11px]" : "left-[11px]"
              } ${on ? "text-primary font-semibold" : "text-gray-400"}`}
            >
              {stop.city}
            </span>
          </span>
        );
      })}
    </div>
  );
}
