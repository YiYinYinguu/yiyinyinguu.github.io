#!/usr/bin/env python3
"""生成 Routes 一级页那个地球仪的陆地数据 public/routes/land.json。

球是 d3-geo 的正射投影实时算出来的，所以这里只需要一份 GeoJSON。

数据源是 github.com/vvoliucano/world.geo.json：作者在 johan/world.geo.json
的基础上修正了藏南、台湾的归属并补了中文地名，同一个仓库里还有一份带九段线的
南海诸岛。常见的公开世界地理数据在这几处的画法跟我国的主张不一致，这是一个
中文语境的个人主页，用这一份。

代价是精度：这份数据是 1:110M 那一档，中国只有 247 个坐标点，比 world-atlas
的 1:50M 粗不少。球能放大到 8 倍，放到底时海岸线看得出是折线。要换回更细的，
把 SOURCE_COUNTRIES 换成 https://unpkg.com/world-atlas@2/countries-50m.json
并加回 TopoJSON 解码——但那份的边界就是公开数据的默认画法。

    python3 scripts/build-world-geo.py

南海那份文件里除了九段线还有海南、广东等省级多边形，那些跟国家轮廓重复，
所以只取九段线那一条线。
"""
import json
import math
import os
import urllib.request

BASE = "https://raw.githubusercontent.com/vvoliucano/world.geo.json/master"
SOURCE_COUNTRIES = f"{BASE}/countries.geo.json"
SOURCE_SOUTH_SEA = f"{BASE}/south_china_sea.json"
# 中国的轮廓单独取 DataV 那一份：它跟「去过的地方」那一层的省市边界同源，
# 放大之后国境线和城市轮廓才对得上。用 110m 的那份会差两个数量级，
# 缩着看不出来，一放大城市就明显浮在国境线外面。
SOURCE_CHINA = "https://geo.datav.aliyun.com/areas_v3/bound/100000.json"

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "routes", "land.json")

# 源数据本身就不细，只做很轻的抽稀去掉冗余点，别再削形状。
# 小于 0.15 平方度的岛（约 40km 见方）丢掉——球上就一两个像素。
EPSILON = 0.03
MIN_AREA = 0.15
PRECISION = 2


def fetch(url):
    print(f"下载 {url}")
    with urllib.request.urlopen(url) as response:
        return json.load(response)


def simplify(points, eps):
    """道格拉斯-普克。递归版本在长海岸线上会爆栈，所以用显式栈。"""
    if len(points) < 4:
        return points

    def perpendicular(p, a, b):
        (x1, y1), (x2, y2), (x0, y0) = a, b, p
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


def signed_area(points):
    """鞋带公式，带符号。正数是逆时针。"""
    total = 0
    for i in range(len(points) - 1):
        total += points[i][0] * points[i + 1][1] - points[i + 1][0] * points[i][1]
    return total / 2


def clean_ring(ring, outer=True, eps=EPSILON):
    points = simplify([p[:2] for p in ring], eps)
    if len(points) < 4:
        return None
    # 闭合环的首尾必须重合，抽稀之后补一下
    if points[0] != points[-1]:
        points.append(points[0])
    signed = signed_area(points)
    if abs(signed) < MIN_AREA:
        return None
    # d3-geo 的球面裁剪要求外环顺时针（经纬度平面上鞋带公式为负）、内环逆时针，
    # 跟 RFC 7946 正好相反。方向反了的话这一块会被理解成
    # 「除它之外的整个地球」，整个球涂满。两个数据源的绕向不一致，统一掰过来。
    if (signed > 0) if outer else (signed < 0):
        points.reverse()
    return [[round(x, PRECISION), round(y, PRECISION)] for x, y in points]


def clean_line(line):
    points = simplify([p[:2] for p in line], EPSILON)
    return [[round(x, PRECISION), round(y, PRECISION)] for x, y in points]


def main():
    countries = fetch(SOURCE_COUNTRIES)
    china = fetch(SOURCE_CHINA)["features"]

    # 换掉 110m 那份粗糙的中国，其余国家不动
    swapped = [f for f in countries["features"] if f["properties"].get("name") != "China"]
    swapped += china
    print(f"中国换成 DataV 的轮廓（{len(countries['features'])} → {len(swapped)} 个要素）")

    china_names = {"中华人民共和国"}
    features, dropped = [], 0
    for feature in swapped:
        # 中国是这张图的主角，容差给细一点，好跟城市那一层对得上
        eps = EPSILON / 4 if feature["properties"].get("name") in china_names else EPSILON
        geometry = feature["geometry"]
        if geometry["type"] == "Polygon":
            polygons = [geometry["coordinates"]]
        elif geometry["type"] == "MultiPolygon":
            polygons = geometry["coordinates"]
        else:
            continue

        kept = []
        for polygon in polygons:
            rings = [clean_ring(r, i == 0, eps) for i, r in enumerate(polygon)]
            # 外环没了就整块丢掉；内环（湖）没了只是少个洞
            if rings and rings[0]:
                kept.append([r for r in rings if r])
            else:
                dropped += 1
        if kept:
            features.append(
                {
                    "type": "Feature",
                    "properties": {},
                    "geometry": {"type": "MultiPolygon", "coordinates": kept},
                }
            )

    # 九段线是线不是面，单独一层画，不能跟陆地一起填充
    sea = fetch(SOURCE_SOUTH_SEA)
    lines = []
    for feature in sea["features"]:
        if feature["geometry"]["type"] != "MultiLineString":
            continue  # 同文件里的省级多边形跟国家轮廓重复，跳过
        lines.append(
            {
                "type": "Feature",
                "properties": {"name": feature["properties"].get("name", "")},
                "geometry": {
                    "type": "MultiLineString",
                    "coordinates": [
                        clean_line(line) for line in feature["geometry"]["coordinates"]
                    ],
                },
            }
        )

    payload = json.dumps(
        {
            "land": {"type": "FeatureCollection", "features": features},
            "lines": {"type": "FeatureCollection", "features": lines},
        },
        separators=(",", ":"),
    )
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(payload)

    points = sum(len(r) for f in features for p in f["geometry"]["coordinates"] for r in p)
    segments = sum(len(f["geometry"]["coordinates"]) for f in lines)
    names = ", ".join(f["properties"]["name"] for f in lines)
    print(f"{len(features)} 个国家 · {points} 个坐标点 · 丢掉 {dropped} 个小岛")
    print(f"另有 {len(lines)} 条线（{segments} 段）：{names}")
    print(f"{OUT}  {len(payload) / 1024:.0f} KB")


if __name__ == "__main__":
    main()
