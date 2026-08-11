#!/usr/bin/env python3
"""生成地球仪上「去过的地方」那一层 public/routes/visited.json。

点太小，说明不了「到过哪儿」，所以给去过的地方上底色，两种粒度：
    国家    整个国家一块色，中国也是一整片
    城市    中国到市，国外到一级行政区（都道府县 / 大区 / 省）

    python3 scripts/build-flights.py     # 航班那一层
    python3 scripts/build-visited.py     # 这一层

数据源：
    中国  阿里云 DataV.GeoAtlas，含港澳台和南海诸岛
    国外  Natural Earth 10m 一级行政区（自带中文名），40MB，下载后缓存在 /tmp

PLACES 是手录的——去过但没有机票记录的地方（火车、开车、小时候去的）
在任何数据里都查不到，只能自己记。加新地方就往里加一行，
名字对不上数据源的话脚本会打出来提醒。
"""
import json
import math
import os
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "routes", "visited.json")

PROVINCES = "https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json"
CITY_LEVEL = "https://geo.datav.aliyun.com/areas_v3/bound/{}_full.json"
COUNTRIES = "https://raw.githubusercontent.com/vvoliucano/world.geo.json/master/countries.geo.json"
# 中国的轮廓跟底图用同一份 DataV 数据。用 110m 那份的话，这块底色的边缘
# 会跟底图的国境线差出去一大截——放大到中尼边境一看就露馅。
CHINA_OUTLINE = "https://geo.datav.aliyun.com/areas_v3/bound/100000.json"
ADMIN1 = ("https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master"
          "/geojson/ne_10m_admin_1_states_provinces.geojson")
CACHE_DIR = "/tmp/visited-geo"   # 边界文件缓存，改 PLACES 重跑时不用重下

EPSILON = 0.05
MIN_AREA = 0.08
PRECISION = 2

# ── 中国：(省adcode, 市adcode)。市留空表示到省为止——
#    直辖市和特别行政区市即是省。不再往县下沉：安吉画成湖州、红原画成阿坝州，
#    球上那个尺度看不出县和市的差别，多下一级只是把数据搞大。
CN = {
    "北京":     ("110000", ""),
    "上海":     ("310000", ""),
    "重庆":     ("500000", ""),
    "香港":     ("810000", ""),
    "台湾":     ("710000", ""),
    "杭州":     ("330000", "330100"),
    "宁波":     ("330000", "330200"),
    "绍兴":     ("330000", "330600"),
    "温州":     ("330000", "330300"),
    "台州":     ("330000", "331000"),
    "湖州":     ("330000", "330500"),   # 安吉在湖州
    "南京":     ("320000", "320100"),
    "苏州":     ("320000", "320500"),
    "厦门":     ("350000", "350200"),
    "福州":     ("350000", "350100"),
    "泉州":     ("350000", "350500"),
    
    "南昌":     ("360000", "360100"),
    "上饶":     ("360000", "361100"),   # 婺源在上饶
    "青岛":     ("370000", "370200"),
    "烟台":     ("370000", "370600"),
    "长沙":     ("430000", "430100"),
    "广州":     ("440000", "440100"),
    "海口":     ("460000", "460100"),
    "三亚":     ("460000", "460200"),
    "太原":     ("140000", "140100"),
    "大同":     ("140000", "140200"),
    "沈阳":     ("210000", "210100"),
    "哈尔滨":   ("230000", "230100"),
    "西安":     ("610000", "610100"),
    "成都":     ("510000", "510100"),
    "阿坝":     ("510000", "513200"),   # 红原在阿坝州
    "甘孜":     ("510000", "513300"),   # 海螺沟在甘孜州泸定县   # 在甘孜州泸定县
    "昆明":     ("530000", "530100"),
    "丽江":     ("530000", "530700"),
    "大理":     ("530000", "532900"),
    "西双版纳": ("530000", "532800"),
       # 丽江宁蒗县那一侧
}

# ── 国外：(国家在 Natural Earth 里的 admin 名, 一级行政区名)。
#    一级行政区留空 = 只知道去过这个国家，不记得具体哪儿。
XX = {
    "新加坡":     ("Singapore", ""),
    "巴黎":       ("France", "Paris"),
    "墨尔本":     ("Australia", "Victoria"),
    "东京":       ("Japan", "Tokyo"),
    "大阪":       ("Japan", "Ōsaka"),
    "京都":       ("Japan", "Kyōto"),
    "米兰":       ("Italy", "Milano"),
    "罗马":       ("Italy", "Roma"),
    "佛罗伦萨":   ("Italy", "Firenze"),
    "巴塞罗那":   ("Spain", "Barcelona"),
    "格拉纳达":   ("Spain", "Granada"),
    "塞维利亚":   ("Spain", "Sevilla"),
    "波尔图":     ("Portugal", "Porto"),
    "布达佩斯":   ("Hungary", "Budapest"),
    "维也纳":     ("Austria", "Wien"),
    "奥地利湖区": ("Austria", "Oberösterreich"),      # 哈尔施塔特那一带
    "哥本哈根":   ("Denmark", "Hovedstaden"),
    "欧登塞":     ("Denmark", "Syddanmark"),
    "夏威夷":     ("United States of America", "Hawaii"),
    "洛杉矶":     ("United States of America", "California"),   # 转机
    "瑞士":       ("Switzerland", ""),                # 具体城市待确认
    "巴厘岛":     ("Indonesia", "Bali"),
    "芽庄":       ("Vietnam", "Khánh Hòa"),
    "大叻":       ("Vietnam", "Lâm Đồng"),
    "亚庇":       ("Malaysia", "Sabah"),
    "新山":       ("Malaysia", "Johor"),
    "南非":       ("South Africa", ""),           # 城市记不清了，只到国家
}

# 国家的中文名，Natural Earth 那份国界数据里只有英文
COUNTRY_ZH = {
    "Singapore": "新加坡", "France": "法国", "Australia": "澳大利亚",
    "Japan": "日本", "Italy": "意大利", "Spain": "西班牙",
    "Portugal": "葡萄牙", "South Africa": "南非",
    "Vietnam": "越南", "Malaysia": "马来西亚",
    "Hungary": "匈牙利", "Austria": "奥地利", "Denmark": "丹麦",
    "Switzerland": "瑞士", "United States of America": "美国",
    "Indonesia": "印度尼西亚", "China": "中国",
}

# 中国的市县英文名，DataV 只有中文
CN_EN = {
    "北京": "Beijing", "上海": "Shanghai", "重庆": "Chongqing", "香港": "Hong Kong",
    "台湾": "Taiwan", "杭州": "Hangzhou", "宁波": "Ningbo", "温州": "Wenzhou",
    "台州": "Taizhou", "南京": "Nanjing", "苏州": "Suzhou", "绍兴": "Shaoxing", "厦门": "Xiamen",
    "福州": "Fuzhou", "泉州": "Quanzhou", "南昌": "Nanchang",
    "青岛": "Qingdao", "烟台": "Yantai", "长沙": "Changsha", "广州": "Guangzhou",
    "海口": "Haikou", "三亚": "Sanya", "太原": "Taiyuan", "大同": "Datong", "沈阳": "Shenyang",
    "哈尔滨": "Harbin", "西安": "Xi'an", "成都": "Chengdu",     "昆明": "Kunming", "丽江": "Lijiang", "大理": "Dali", "西双版纳": "Xishuangbanna",
    "湖州": "Huzhou", "上饶": "Shangrao", "阿坝": "Aba", "甘孜": "Garzê",
    # 省
    "北京市": "Beijing", "上海市": "Shanghai", "重庆市": "Chongqing",
    "浙江": "Zhejiang", "江苏": "Jiangsu", "福建": "Fujian", "江西": "Jiangxi",
    "山东": "Shandong", "湖南": "Hunan", "广东": "Guangdong", "海南": "Hainan",
    "山西": "Shanxi", "辽宁": "Liaoning", "黑龙江": "Heilongjiang",
    "陕西": "Shaanxi", "四川": "Sichuan", "云南": "Yunnan",
}


def fetch(url):
    """边界文件都不小，缓存在 /tmp——加一个地方就重下一遍全部太慢了。"""
    os.makedirs(CACHE_DIR, exist_ok=True)
    cache = os.path.join(CACHE_DIR, url.rsplit("/", 1)[-1].replace("?", "_"))
    if os.path.exists(cache):
        return json.load(open(cache, encoding="utf-8"))
    print(f"下载 {url}")
    with urllib.request.urlopen(url) as response:
        data = json.load(response)
    json.dump(data, open(cache, "w", encoding="utf-8"))
    return data


def simplify(points, eps):
    """道格拉斯-普克。递归版本在长边界上会爆栈，所以用显式栈。"""
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


def clean(ring, outer, eps):
    points = simplify([p[:2] for p in ring], eps)
    if len(points) < 4:
        return None
    if points[0] != points[-1]:
        points.append(points[0])
    signed = signed_area(points)
    if abs(signed) < (MIN_AREA if eps >= EPSILON else MIN_AREA / 8):
        return None
    # d3-geo 的球面裁剪要求外环顺时针（经纬度平面上鞋带公式为负）、内环逆时针，
    # 跟 RFC 7946 正好相反。方向反了的话，一块多边形会被理解成
    # 「除这块之外的整个地球」，整个球涂满、边缘还多一圈。
    if (signed > 0) if outer else (signed < 0):
        points.reverse()
    return [[round(x, PRECISION), round(y, PRECISION)] for x, y in points]


def shape(feature, zh, en, fine):
    """fine 表示这是细粒度的那一层，形状小，容差要收紧。"""
    geometry = feature["geometry"]
    polygons = ([geometry["coordinates"]] if geometry["type"] == "Polygon"
                else geometry["coordinates"])
    # 细粒度那一层是放大了看的，容差给到 EPSILON/6：
    # 再粗就能看出城市边缘是折线，跟底图的国境线也对不齐
    eps = EPSILON / 6 if fine else EPSILON
    kept = []
    for polygon in polygons:
        rings = [clean(r, i == 0, eps) for i, r in enumerate(polygon)]
        if rings and rings[0]:
            kept.append([r for r in rings if r])
    if not kept:
        return None
    return {"type": "Feature",
            "properties": {"name": zh, "zh": zh, "en": en},
            "geometry": {"type": "MultiPolygon", "coordinates": kept}}


def main():
    coarse, fine, missing = [], [], []

    # ── 中国：市（细）。粗粒度下中国是一整片，跟别的国家一样，
    #    所以省那一层不要了；省级数据还留着，是为了拿市的清单。
    province_features = fetch(PROVINCES)["features"]

    by_province = {}
    for zh, (province, city) in CN.items():
        if city:
            by_province.setdefault(province, {})[city] = zh
        else:
            for feature in province_features:
                if str(feature["properties"].get("adcode")) == province:
                    if s := shape(feature, zh, CN_EN.get(zh, zh), fine=False):
                        fine.append(s)
    for province, wanted in sorted(by_province.items()):
        found = set()
        for feature in fetch(CITY_LEVEL.format(province))["features"]:
            code = str(feature["properties"].get("adcode"))
            if code in wanted:
                found.add(code)
                zh = wanted[code]
                if s := shape(feature, zh, CN_EN.get(zh, zh), fine=True):
                    fine.append(s)
        missing += [f"{wanted[c]}（{c} 不在 {province} 里）" for c in set(wanted) - found]

    # ── 国家（粗）：中国和去过的那些国家，一视同仁
    want_countries = {c for c, _ in XX.values()} | {"China"}
    for feature in fetch(COUNTRIES)["features"]:
        name = feature["properties"].get("name", "")
        if name in want_countries and name != "China":
            if s := shape(feature, COUNTRY_ZH.get(name, name), name, fine=False):
                coarse.append(s)
    # 中国单独取 DataV，跟底图同源；fine=True 是为了用细一档的容差，
    # 不然这块底色的边缘还是会跟底图的国境线错开
    for feature in fetch(CHINA_OUTLINE)["features"]:
        if s := shape(feature, "中国", "China", fine=True):
            coarse.append(s)
    got = {f["properties"]["en"] for f in coarse}
    # 110m 的国界数据会略掉太小的国家（新加坡就没有）。这种情况拿
    # Natural Earth 的一级行政区拼一个出来顶上，粗细两层就都有它了。
    for country in sorted(want_countries - got):
        pieces = [f for f in fetch(ADMIN1)["features"]
                  if f["properties"].get("admin") == country]
        rings = []
        for piece in pieces:
            if s := shape(piece, "", "", fine=True):
                rings += s["geometry"]["coordinates"]
        if rings:
            coarse.append({"type": "Feature",
                           "properties": {"name": COUNTRY_ZH.get(country, country),
                                          "zh": COUNTRY_ZH.get(country, country),
                                          "en": country},
                           "geometry": {"type": "MultiPolygon", "coordinates": rings}})
        else:
            missing.append(f"{country}（国界和一级行政区里都没有）")

    # ── 国外：一级行政区（细）。不记得具体在哪儿的，细粒度下退回整个国家。
    want_admin1 = {(country, region) for country, region in XX.values() if region}
    if want_admin1:
        admin1 = fetch(ADMIN1)["features"]
        found = set()
        for feature in admin1:
            props = feature["properties"]
            key = (props.get("admin"), props.get("name"))
            if key in want_admin1:
                found.add(key)
                # 形状只能到一级行政区（没有国外城市的边界数据），但标签用
                # 去的那座城市——挂个「罗马省」「大阪府」在上面很奇怪
                zh = next(k for k, v in XX.items() if v == key)
                if s := shape(feature, zh, props.get("name"), fine=True):
                    fine.append(s)
        missing += [f"{a}·{b}（一级行政区里没有这个名字）" for a, b in want_admin1 - found]
    for zh, (country, region) in XX.items():
        if not region:  # 只知道国家的，细粒度下也画整个国家
            for f in coarse:
                if f["properties"]["en"] == country:
                    fine.append(f)

    if missing:
        print("\n⚠️  这些没对上，检查一下代码或名字：")
        for m in missing:
            print("   ", m)

    payload = json.dumps(
        {"coarse": {"type": "FeatureCollection", "features": coarse},
         "fine": {"type": "FeatureCollection", "features": fine}},
        separators=(",", ":"), ensure_ascii=False)
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(payload)

    print(f"\n粗（省·国）{len(coarse)} 个：{'、'.join(f['properties']['zh'] for f in coarse)}")
    print(f"\n细（城市）{len(fine)} 个：{'、'.join(f['properties']['zh'] for f in fine)}")
    print(f"\n{OUT}  {len(payload) / 1024:.0f} KB")


if __name__ == "__main__":
    main()
