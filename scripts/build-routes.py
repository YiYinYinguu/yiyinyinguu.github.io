#!/usr/bin/env python3
"""把 Apple Watch 导出的 folium 地图榨成网站能用的紧凑 JSON。

源文件是 folium 生成的 HTML，一条轨迹一个 L.polyline，配一个写着
「类型 | 日期 | 里程」的 tooltip。原始文件 12.5MB、24.7 万个坐标点，
直接进仓库不合适，所以这一步是离线跑的，产物才进版本控制。

    python3 scripts/build-routes.py ~/Downloads/apple_watch_routes.html

产物（都在 public/routes/ 下）:
    index.json     城市清单 + 统计 + 缩略线团的 svg path，构建时读进一级页
    <city>.json    该城全部轨迹，点进城市时才 fetch

三道过滤，理由见 docs/superpowers/specs/2026-08-11-life-routes-design.md：
  1. 单条 < 0.1km 的丢掉——手表误触，自动开始又停下，不是记录
  2. 全城合计 < 10km 的城市丢掉——去过一次走了几百米，撑不起一个页面
  3. 道格拉斯-普克抽稀到 3 米——城市尺度下肉眼无差别，体积掉到百分之一
"""
import json
import math
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# 数据放在 public/ 下：构建时 lib/routes.ts 用 fs 读它，运行时浏览器
# 又能直接 fetch 同一份。存两份只会带来「哪份是真的」这种问题。
OUT = os.path.join(ROOT, "public", "routes")

NOISE_KM = 0.1      # 单条轨迹的下限
CITY_KM = 10.0      # 城市合计的下限
EPSILON = 0.00003   # 抽稀容差，约 3 米
THUMB = 100         # 缩略线团的 viewBox 边长

# 城市按最近的中心点归类。新去一个地方就往这里加一行；
# 没登记的地方会归到最近的已知城市，脚本会把超过 60km 的可疑归类打出来。
CITIES = [
    ("hangzhou",  "杭州",   "Hangzhou",  30.26, 120.15),
    ("beijing",   "北京",   "Beijing",   39.99, 116.33),
    ("singapore", "新加坡", "Singapore",  1.33, 103.82),
    ("anji",      "安吉",   "Anji",      30.53, 119.80),
    ("datong",    "大同",   "Datong",    40.09, 113.30),
    ("ningbo",    "宁波",   "Ningbo",    29.87, 121.82),
    ("melbourne", "墨尔本", "Melbourne", -37.81, 144.96),
    ("shanghai",  "上海",   "Shanghai",  31.23, 121.47),
    ("paris",     "巴黎",   "Paris",     48.73,   2.34),
    ("lijiang",   "丽江",   "Lijiang",   26.87, 100.23),
    ("dali",      "大理",   "Dali",      25.69, 100.16),
    ("guangzhou", "广州",   "Guangzhou", 23.13, 113.30),
]


def nearest_city(lat, lon):
    """按经纬度找最近的城市，同时返回距离（km）好让调用方判断靠不靠谱。"""
    best, best_d = None, float("inf")
    for city in CITIES:
        # 经度要按纬度收窄，否则高纬度地区会算偏
        d = math.hypot(lat - city[3], (lon - city[4]) * math.cos(math.radians(lat)))
        if d < best_d:
            best, best_d = city, d
    return best, best_d * 111


def simplify(points, eps):
    """道格拉斯-普克。递归版本在 5000 点的轨迹上会爆栈，所以用显式栈。"""
    if len(points) < 3:
        return points

    def perpendicular(p, a, b):
        (y1, x1), (y2, x2), (y0, x0) = a, b, p
        dx, dy = x2 - x1, y2 - y1
        if dx == 0 and dy == 0:
            return math.hypot(x0 - x1, y0 - y1)
        t = max(0, min(1, ((x0 - x1) * dx + (y0 - y1) * dy) / (dx * dx + dy * dy)))
        return math.hypot(x0 - (x1 + t * dx), y0 - (y1 + t * dy))

    keep = [False] * len(points)
    keep[0] = keep[-1] = True
    stack = [(0, len(points) - 1)]
    while stack:
        i, j = stack.pop()
        if j <= i + 1:
            continue
        far, idx = 0, i
        for k in range(i + 1, j):
            d = perpendicular(points[k], points[i], points[j])
            if d > far:
                far, idx = d, k
        if far > eps:
            keep[idx] = True
            stack.append((i, idx))
            stack.append((idx, j))
    return [p for p, k in zip(points, keep) if k]


def parse(html):
    """从 folium 的 HTML 里抠出每条轨迹的坐标和它的 tooltip。"""
    tooltips = {
        m.group(1): m.group(2)
        for m in re.finditer(
            r"(poly_line_[a-f0-9]+)\.bindTooltip\(\s*`<div>\s*(.*?)\s*</div>`", html, re.S
        )
    }
    tracks = []
    for m in re.finditer(
        r"var (poly_line_[a-f0-9]+) = L\.polyline\(\s*(\[\[.*?\]\])\s*,\s*\{", html, re.S
    ):
        pid, points = m.group(1), json.loads(m.group(2))
        parts = [p.strip() for p in tooltips.get(pid, "").split("|")]
        if len(parts) != 3:
            raise SystemExit(f"{pid} 的 tooltip 不是「类型 | 日期 | 里程」: {parts}")
        tracks.append(
            {
                "k": parts[0],
                "d": parts[1],
                "km": round(float(parts[2].split()[0]), 2),
                "p": points,
            }
        )
    return tracks


def thumb_path(tracks, bbox):
    """把一座城市的全部轨迹叠成一条 svg path，给一级页的卡片当缩略图。

    不是图标——是真的按经纬度画出来的形状。杭州是密的一团，
    新加坡是几条贯穿的长线，一眼能认出区别。
    """
    south, west, north, east = bbox
    lat_span = max(north - south, 1e-4)
    lon_span = max((east - west) * math.cos(math.radians(south)), 1e-4)
    scale = (THUMB - 12) / max(lat_span, lon_span)
    ox = (THUMB - lon_span * scale) / 2
    oy = (THUMB - lat_span * scale) / 2
    cos_lat = math.cos(math.radians(south))

    segments = []
    for t in tracks:
        # 投影到 100×100 之后再抽一道稀：地图上 3 米的精度在指甲盖大的缩略图里
        # 是几百分之一个像素，全带上只是让 index.json 白白胖四倍。
        box = [[oy + (north - p[0]) * scale, ox + (p[1] - west) * cos_lat * scale] for p in t["p"]]
        box = simplify(box, 0.4)
        d = "".join(
            ("L" if i else "M") + f"{x:.1f} {y:.1f}" for i, (y, x) in enumerate(box)
        )
        segments.append(d)
    return "".join(segments)


def main():
    if len(sys.argv) < 2:
        raise SystemExit(f"用法: python3 {sys.argv[0]} <folium 导出的 html>")
    source = os.path.expanduser(sys.argv[1])
    html = open(source, encoding="utf-8").read()

    tracks = parse(html)
    raw_points = sum(len(t["p"]) for t in tracks)
    print(f"读到 {len(tracks)} 条轨迹，{raw_points} 个坐标点")

    # 1. 噪音
    noise = [t for t in tracks if t["km"] < NOISE_KM]
    tracks = [t for t in tracks if t["km"] >= NOISE_KM]
    print(f"剔掉 {len(noise)} 条 <{NOISE_KM}km 的误触记录")

    # 2. 归类
    grouped, suspicious = {}, []
    for t in tracks:
        city, distance = nearest_city(*t["p"][0])
        if distance > 60:
            suspicious.append((t["d"], round(t["p"][0][0], 3), round(t["p"][0][1], 3), round(distance)))
        grouped.setdefault(city, []).append(t)
    if suspicious:
        print("⚠️  这些起点离最近的已知城市超过 60km，可能归错了，考虑往 CITIES 里加一行:")
        for row in suspicious:
            print("   ", row)

    # 3. 抽稀 + 按城市合计过滤
    index, kept_points = [], 0
    os.makedirs(OUT, exist_ok=True)
    for city, items in sorted(grouped.items(), key=lambda kv: -sum(t["km"] for t in kv[1])):
        cid, zh, en, lat, lon = city
        total = sum(t["km"] for t in items)
        if total < CITY_KM:
            print(f"跳过 {zh}：合计 {total:.1f} km，不到 {CITY_KM} km")
            continue

        for t in items:
            t["p"] = [[round(a, 5), round(b, 5)] for a, b in simplify(t["p"], EPSILON)]
        items.sort(key=lambda t: (t["d"], -t["km"]))
        for i, t in enumerate(items):
            t["id"] = f"{cid}-{t['d']}-{i}"

        lats = [p[0] for t in items for p in t["p"]]
        lons = [p[1] for t in items for p in t["p"]]
        bbox = [min(lats), min(lons), max(lats), max(lons)]
        kinds = {}
        for t in items:
            kinds[t["k"]] = kinds.get(t["k"], 0) + 1
        kept_points += sum(len(t["p"]) for t in items)

        with open(os.path.join(OUT, f"{cid}.json"), "w", encoding="utf-8") as f:
            json.dump({"id": cid, "tracks": items}, f, separators=(",", ":"), ensure_ascii=False)

        index.append(
            {
                "id": cid,
                "zh": zh,
                "en": en,
                "lat": lat,
                "lon": lon,
                "n": len(items),
                "km": round(total, 1),
                "from": min(t["d"] for t in items),
                "to": max(t["d"] for t in items),
                "kinds": kinds,
                "bbox": [round(v, 5) for v in bbox],
                "thumb": thumb_path(items, bbox),
            }
        )
        print(f"  {zh:<5} {len(items):>4} 条 {total:>7.1f} km  {min(t['d'] for t in items)} — {max(t['d'] for t in items)}  {kinds}")

    index.sort(key=lambda c: -c["n"])
    with open(os.path.join(OUT, "index.json"), "w", encoding="utf-8") as f:
        json.dump(index, f, separators=(",", ":"), ensure_ascii=False)

    size = sum(
        os.path.getsize(os.path.join(OUT, n)) for n in os.listdir(OUT) if n.endswith(".json")
    )
    print(
        f"\n{len(index)} 座城市 · {sum(c['n'] for c in index)} 条 · "
        f"{sum(c['km'] for c in index):.1f} km"
    )
    print(f"坐标点 {raw_points} → {kept_points}，产物合计 {size / 1024:.0f} KB")


if __name__ == "__main__":
    main()
