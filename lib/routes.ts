import fs from "fs";
import path from "path";

// 数据在 public/routes/ 下：这里构建时用 fs 读，浏览器点进城市时 fetch 同一份。
// 放两份的话，改了一份忘了另一份就是一个查半天的 bug。
const DATA_DIR = path.join(process.cwd(), "public", "routes");

/** 一条轨迹。字段名是短的——每座城市几十上百条，长名字纯属浪费带宽。 */
export interface Track {
  id: string;
  k: string; // 骑行 / 步行 / 徒步
  d: string; // YYYY-MM-DD
  km: number;
  p: Array<[number, number]>; // [lat, lon]
}

export interface RouteCity {
  id: string;
  zh: string;
  en: string;
  lat: number;
  lon: number;
  n: number;
  km: number;
  from: string;
  to: string;
  kinds: Record<string, number>;
  bbox: [number, number, number, number]; // [south, west, north, east]
  /** 该城全部轨迹叠出来的缩略线团，viewBox 100×100 的一条 svg path */
  thumb: string;
}

/**
 * 城市清单。数据是 scripts/build-routes.py 离线生成的，这里只负责读；
 * 想更新轨迹就重跑一次脚本，网站构建时不碰原始的 folium 导出。
 */
export function getRouteCities(): RouteCity[] {
  const file = path.join(DATA_DIR, "index.json");
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

/** 某座城市的全部轨迹。客户端点进城市时会 fetch 同一个文件。 */
export function getCityTracks(id: string): Track[] {
  const file = path.join(DATA_DIR, `${id}.json`);
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, "utf-8")).tracks;
}

/** 全部城市的合计，给一级页的标题行。 */
export function summarize(cities: RouteCity[]) {
  return {
    cities: cities.length,
    n: cities.reduce((sum, c) => sum + c.n, 0),
    km: Math.round(cities.reduce((sum, c) => sum + c.km, 0) * 10) / 10,
    from: cities.map((c) => c.from).sort()[0] ?? "",
    to: cities.map((c) => c.to).sort().slice(-1)[0] ?? "",
  };
}
