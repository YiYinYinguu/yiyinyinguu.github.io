import type { Track } from "@/lib/routes";

/**
 * 三种活动的颜色，全部取自站点已有的色系——同一暖色系拉三阶明度，
 * 而不是三个色相。将来加第四种活动，往这个梯度里插一格就行。
 */
export const KIND_COLOR: Record<string, string> = {
  骑行: "#b12b32", // 站点主色，骑行最多，给最强的
  步行: "#8c8073", // 暖灰，呼应世界地图的陆地色；日常，让它退后
  徒步: "#4a4038", // 深褐墨，最重；全站只有几条，读成「特别的那几次」
};
export const FALLBACK_COLOR = "#b12b32";

export const color = (kind: string) => KIND_COLOR[kind] ?? FALLBACK_COLOR;

/** 多长才算一条「主要路线」，短于这个的画成浅色底子。用户可以在页面上调。 */
export const DEFAULT_MIN_KM = 3;
export const MIN_KM_RANGE = { min: 0.5, max: 12, step: 0.5 };

/** 捏合一个像素换多少缩放级。这个数是拿触控板试出来的，别凭感觉改。 */
export const PINCH_PER_PX = 0.013;

export type Sort = { by: "date" | "km"; asc: boolean };

export function sortTracks(tracks: Track[], sort: Sort): Track[] {
  const dir = sort.asc ? 1 : -1;
  return [...tracks].sort((a, b) =>
    sort.by === "km"
      ? dir * (a.km - b.km) || a.d.localeCompare(b.d)
      : dir * a.d.localeCompare(b.d) || a.km - b.km
  );
}

/** 「2025-11-30」→「2025.11.30」，中英文都用这个写法。 */
export const fmtDate = (d: string) => d.replace(/-/g, ".");

/** 「2025-11-30」→「2025.11」，统计行里只到月。 */
export const fmtMonth = (d: string) => d.slice(0, 7).replace("-", ".");

/** 两点之间的大圆距离，km。只用来判断一条路线是不是绕回了原点。 */
export function crowDistance(a: [number, number], b: [number, number]) {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLon = ((b[1] - a[1]) * Math.PI) / 180;
  const la = (a[0] * Math.PI) / 180;
  const lb = (b[0] * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(la) * Math.cos(lb);
  return 2 * R * Math.asin(Math.sqrt(h));
}
