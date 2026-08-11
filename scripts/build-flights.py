#!/usr/bin/env python3
"""生成地球仪上「去过哪」那一层的数据 public/routes/flights.json。

来源是航旅纵横的历史行程，一条条手录的——那个 App 没有导出功能，
只能翻截图。列表倒序显示，同一天的多段只在第一段标日期，所以录入时
要把当天转机的那几段补上日期（下面标了注释的那几条）。

再飞了新的地方就往 FLIGHTS 里加一行，城市不在 CITIES 里的话脚本会报错提醒。

    python3 scripts/build-flights.py

产物里有两样：
    cities  去过的城市，带起降次数和年份跨度 —— 球上画成空心圈
    routes  城市对（不分方向），带次数 —— 球上画成大圆弧，可以关掉
"""
import json
import os
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "routes", "flights.json")

# (日期, 航班号, 出发, 到达)
FLIGHTS = [
    ("2026-05-26", "MU6077", "宁波", "新加坡"),
    ("2026-03-26", "MU6161", "宁波", "新加坡"),
    ("2026-01-18", "MF8060", "沈阳", "杭州"),
    ("2026-01-16", "MF8049", "杭州", "沈阳"),
    ("2025-11-19", "GJ8850", "丽江", "杭州"),
    ("2025-11-15", "GJ8849", "杭州", "丽江"),
    ("2025-05-25", "CA1722", "北京", "杭州"),
    ("2025-05-23", "CA1707", "杭州", "北京"),
    ("2024-10-09", "CA1535", "北京", "宁波"),
    ("2024-10-08", "CA934", "巴黎", "北京"),
    ("2024-01-29", "CA875", "北京", "巴黎"),
    ("2024-01-28", "CA1729", "杭州", "北京"),
    ("2023-10-29", "3U6933", "成都", "杭州"),
    ("2023-10-28", "3U3886", "墨尔本", "成都"),
    ("2023-10-20", "MF803", "厦门", "墨尔本"),
    ("2023-10-20", "MF8532", "杭州", "厦门"),   # 当天转机，截图里日期在上一段
    ("2023-06-24", "MU5486", "太原", "杭州"),
    ("2023-06-21", "MU6625", "杭州", "太原"),
    ("2023-01-31", "MU5238", "广州", "宁波"),
    ("2023-01-27", "MU6950", "宁波", "广州"),
    ("2022-09-24", "MU9687", "北京", "杭州"),
    ("2022-04-12", "CA1754", "昆明", "杭州"),
    ("2022-04-08", "JD5282", "西双版纳", "丽江"),
    ("2022-04-03", "MU5547", "杭州", "昆明"),
    ("2021-06-14", "CZ8859", "北京", "杭州"),
    ("2021-06-11", "CZ8852", "杭州", "北京"),
    ("2021-04-06", "CZ2815", "重庆", "宁波"),
    ("2021-04-02", "CZ2816", "宁波", "重庆"),
    ("2020-11-03", "MU2397", "西安", "杭州"),
    ("2020-10-30", "TV6028", "杭州", "西安"),
    ("2020-07-04", "TV6027", "西安", "杭州"),
    ("2020-06-30", "JD5302", "杭州", "西安"),
    ("2019-07-27", "KA626", "香港", "杭州"),
    ("2019-07-27", "CX714", "新加坡", "香港"),  # 当天转机
    ("2019-07-04", "CX715", "香港", "新加坡"),
    ("2019-07-04", "KA621", "杭州", "香港"),    # 当天转机
    ("2019-02-13", "CA4529", "成都", "宁波"),
    ("2019-02-06", "CA1949", "上海", "成都"),
    ("2019-02-06", "MU5699", "宁波", "上海"),   # 当天转机
    ("2018-09-08", "MU9938", "成都", "宁波"),
    ("2018-09-07", "CA4026", "阿坝红原", "成都"),
    ("2018-08-26", "CA4267", "成都", "阿坝红原"),
    ("2018-08-22", "GJ8855", "杭州", "重庆"),
    ("2016-08-06", "EU2729", "长沙", "宁波"),
    ("2016-07-31", "PN6260", "宁波", "长沙"),
    ("2014-02-08", "JD5612", "沈阳", "宁波"),
    ("2014-02-04", "CZ6212", "宁波", "哈尔滨"),
    ("2013-08-01", "MU5482", "青岛", "宁波"),
]

# 城市中心的经纬度，不是机场——球上这个尺度差几十公里看不出来，
# 而且「去过哪座城市」本来说的就是城市。
CITIES = {
    "杭州": ("hangzhou", "Hangzhou", 30.29, 120.16),
    "宁波": ("ningbo", "Ningbo", 29.87, 121.55),
    "北京": ("beijing", "Beijing", 39.90, 116.41),
    "成都": ("chengdu", "Chengdu", 30.57, 104.07),
    "新加坡": ("singapore", "Singapore", 1.35, 103.82),
    "西安": ("xian", "Xi'an", 34.34, 108.94),
    "香港": ("hongkong", "Hong Kong", 22.32, 114.17),
    "沈阳": ("shenyang", "Shenyang", 41.80, 123.43),
    "丽江": ("lijiang", "Lijiang", 26.87, 100.23),
    "重庆": ("chongqing", "Chongqing", 29.56, 106.55),
    "巴黎": ("paris", "Paris", 48.86, 2.35),
    "墨尔本": ("melbourne", "Melbourne", -37.81, 144.96),
    "厦门": ("xiamen", "Xiamen", 24.48, 118.09),
    "太原": ("taiyuan", "Taiyuan", 37.87, 112.55),
    "广州": ("guangzhou", "Guangzhou", 23.13, 113.26),
    "昆明": ("kunming", "Kunming", 25.04, 102.72),
    "上海": ("shanghai", "Shanghai", 31.23, 121.47),
    "阿坝红原": ("hongyuan", "Hongyuan", 32.79, 102.55),
    "长沙": ("changsha", "Changsha", 28.23, 112.94),
    "西双版纳": ("xishuangbanna", "Xishuangbanna", 22.01, 100.80),
    "哈尔滨": ("harbin", "Harbin", 45.80, 126.53),
    "青岛": ("qingdao", "Qingdao", 36.07, 120.38),
}


def main():
    unknown = {c for _, _, a, b in FLIGHTS for c in (a, b) if c not in CITIES}
    if unknown:
        raise SystemExit(f"这些城市还没登记经纬度，往 CITIES 里加一行：{unknown}")

    visits, dates = Counter(), {}
    for date, _, a, b in FLIGHTS:
        for city in (a, b):
            visits[city] += 1
            dates.setdefault(city, []).append(date)

    cities = []
    for zh, count in visits.most_common():
        cid, en, lat, lon = CITIES[zh]
        days = sorted(dates[zh])
        cities.append({"id": cid, "zh": zh, "en": en, "lat": lat, "lon": lon,
                       "n": count, "from": days[0], "to": days[-1]})

    # 航线不分方向：来回算同一条，粗细按飞过几次
    pairs = Counter()
    for _, _, a, b in FLIGHTS:
        pairs[tuple(sorted((a, b)))] += 1
    routes = [{"a": CITIES[a][0], "b": CITIES[b][0], "n": n,
               "from": [CITIES[a][3], CITIES[a][2]],   # GeoJSON 是 [经度, 纬度]
               "to": [CITIES[b][3], CITIES[b][2]]}
              for (a, b), n in pairs.most_common()]

    payload = json.dumps({"cities": cities, "routes": routes},
                         separators=(",", ":"), ensure_ascii=False)
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(payload)

    days = sorted(d for d, _, _, _ in FLIGHTS)
    print(f"{len(FLIGHTS)} 段航班 · {len(cities)} 座城市 · {len(routes)} 条航线")
    print(f"{days[0]} — {days[-1]}")
    print(f"{OUT}  {len(payload) / 1024:.1f} KB")
    print("\n飞得最多的几条：")
    for r in routes[:5]:
        pair = [k for k, v in CITIES.items() if v[0] in (r["a"], r["b"])]
        print(f"  {' — '.join(pair):<16} {r['n']} 次")


if __name__ == "__main__":
    main()
