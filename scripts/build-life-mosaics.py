#!/usr/bin/env python3
"""把每个 Life 板块最近的作品拼成一张封面拼图，给 /life 总览的卡片用。

一张封面只能代表一件作品，拼图能一眼看出这个板块攒了些什么。但是在页面上
直接摆 9 个 <img> 会让总览页从几百 KB 涨到 3MB——方图每张 130KB 上下。
所以在这里合成一张，卡片仍然只加载一张图。

    python3 scripts/build-life-mosaics.py           # 全部板块
    python3 scripts/build-life-mosaics.py baking    # 只做某个板块

产物是 public/life/<板块>-mosaic.jpg，3 列 3 行。
选哪 9 件：沿时间轴均匀取样，不是取最近的 9 件——同一阵子做的东西往往
是同一路的（连着蒸了半个月包子），取最近的会让拼图看起来很单调。
作品不足 9 件时循环补齐，宁可重复也比缺角好看。
内容更新之后要重跑，跟 make-squares.py 一样。
"""
import os
import re
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTENT = os.path.join(ROOT, "content", "life")
PUBLIC = os.path.join(ROOT, "public")

COLS = 3
ROWS = 3
TILE = 180  # 卡片在桌面上约 330px 宽，两倍图给视网膜屏留余量
QUALITY = 80


def squares_of(category: str) -> list[str]:
    """某板块全部作品的方图，按日期倒序——最近的排在前面。"""
    folder = os.path.join(CONTENT, category)
    if not os.path.isdir(folder):
        return []
    picks = []
    for name in sorted(os.listdir(folder), reverse=True):
        if not name.endswith(".md"):
            continue
        text = open(os.path.join(folder, name), encoding="utf-8").read()
        # 优先用方图；没有就退回封面，横图会被下面居中裁成方的
        match = re.search(r"^square:\s*(\S+)", text, re.M) or re.search(
            r"^cover:\s*(\S+)", text, re.M
        )
        if not match:
            continue
        path = os.path.join(PUBLIC, match.group(1).lstrip("/"))
        if os.path.exists(path):
            picks.append(path)
    return picks


def build(category: str) -> bool:
    picks = squares_of(category)
    if not picks:
        print(f"{category}: 没有可用的图，跳过")
        return False

    need = COLS * ROWS
    if len(picks) >= need:
        # 沿整条时间轴均匀取，跨度才拉得开——取最近的 9 件常常全是同一路的
        step = len(picks) / need
        chosen = [picks[int(i * step)] for i in range(need)]
    else:
        # 不足就循环补齐。重复的图在缩略尺寸下不显眼，缺一角却很显眼
        chosen = [picks[i % len(picks)] for i in range(need)]
    tiles = chosen

    sheet = Image.new("RGB", (COLS * TILE, ROWS * TILE), "#fdf5da")
    for index, path in enumerate(tiles):
        img = Image.open(path).convert("RGB")
        # 方图本来就是正方的，横图要居中裁一刀
        side = min(img.size)
        left = (img.width - side) // 2
        top = (img.height - side) // 2
        img = img.crop((left, top, left + side, top + side)).resize(
            (TILE, TILE), Image.LANCZOS
        )
        sheet.paste(img, ((index % COLS) * TILE, (index // COLS) * TILE))

    out = os.path.join(PUBLIC, "life", f"{category}-mosaic.jpg")
    sheet.save(out, "JPEG", quality=QUALITY, optimize=True)
    size = os.path.getsize(out) / 1024
    print(
        f"{category}: {len(picks)} 件作品 → {COLS}×{ROWS} 拼图 "
        f"{sheet.width}×{sheet.height}  {size:.0f} KB"
        + ("（沿时间轴均匀取样）" if len(picks) >= need else f"（不足 {need} 件，循环补齐）")
    )
    for path in tiles:
        print("   ", os.path.basename(path))
    return True


def main():
    wanted = sys.argv[1:]
    categories = wanted or sorted(
        name for name in os.listdir(CONTENT) if os.path.isdir(os.path.join(CONTENT, name))
    )
    for category in categories:
        build(category)


if __name__ == "__main__":
    main()
