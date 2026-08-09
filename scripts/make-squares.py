#!/usr/bin/env python3
"""从每篇文章的 cover 生成手账卡片用的 1:1 方图。

拍立得的相纸窗口是正方形的，照片要填满它，所以这里是裁不是补边。竖图直接
取正中会经常把蛋糕切一半——食物一般不在画面正中，上面往往是虚化的背景。
所以先找细节最密的那一段（背景虚化的地方边缘少），再往正中拉回来一点，
避免裁得太偏。

手机竖拍的照片方向记在 EXIF 里，Pillow 不会自动应用，不转的话会横过来。

    python3 scripts/make-squares.py            # 全部重做
    python3 scripts/make-squares.py baking     # 只做某个板块

产物是 <cover 去掉 -N.jpg>-sq.jpg，写回文章的 square 字段指向它。
"""
import os
import re
import sys

from PIL import Image, ImageFilter, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTENT = os.path.join(ROOT, "content", "life")
PUBLIC = os.path.join(ROOT, "public")
SIZE = 700
# 细节最密的位置和正中之间的取舍：0 = 完全居中，1 = 完全跟着主体
PULL = 0.6


def square_path(cover: str) -> str:
    """/life/baking/2022-02-08-3.jpg → /life/baking/2022-02-08-sq.jpg"""
    return re.sub(r"-\d+\.jpg$", "-sq.jpg", cover)


def crop_offset(im: Image.Image, long_side: int, short_side: int) -> int:
    """沿长边选裁切起点：边缘能量最高的窗口，再往正中拉回 1-PULL。"""
    strip = im.convert("L").filter(ImageFilter.FIND_EDGES)
    portrait = im.height > im.width
    # 压成一维：竖图看每一行的能量，横图看每一列
    strip = strip.resize((1, 200) if portrait else (200, 1), Image.BOX)
    energy = list(strip.getdata())

    scale = len(energy) / long_side
    window = max(1, round(short_side * scale))
    sums = [sum(energy[i : i + window]) for i in range(len(energy) - window + 1)]
    best = sums.index(max(sums)) / scale

    center = (long_side - short_side) / 2
    return round(max(0, min(long_side - short_side, PULL * best + (1 - PULL) * center)))


def make(cover: str) -> str:
    out = square_path(cover)
    # 手机竖拍只在 EXIF 里记方向，先转正，否则方图会横躺
    im = ImageOps.exif_transpose(Image.open(os.path.join(PUBLIC, cover.lstrip("/")))).convert("RGB")
    side = min(im.size)
    if im.height > im.width:
        top = crop_offset(im, im.height, side)
        im = im.crop((0, top, side, top + side))
    elif im.width > im.height:
        left = crop_offset(im, im.width, side)
        im = im.crop((left, 0, left + side, side))
    im.resize((SIZE, SIZE), Image.LANCZOS).save(
        os.path.join(PUBLIC, out.lstrip("/")), quality=82, optimize=True
    )
    return out


def main() -> int:
    only = sys.argv[1] if len(sys.argv) > 1 else None
    made = 0
    for category in sorted(os.listdir(CONTENT)):
        if only and category != only:
            continue
        cat_dir = os.path.join(CONTENT, category)
        if not os.path.isdir(cat_dir):
            continue
        for name in sorted(os.listdir(cat_dir)):
            if not name.endswith(".md"):
                continue
            path = os.path.join(cat_dir, name)
            text = open(path, encoding="utf-8").read()
            m = re.search(r"^cover: (.+)$", text, re.M)
            # 占位封面可能是 svg，没有像素也就无所谓方图
            if not m or not m.group(1).strip().lower().endswith((".jpg", ".jpeg", ".png")):
                continue
            out = make(m.group(1).strip())
            if re.search(r"^square: ", text, re.M):
                text = re.sub(r"^square: .*$", f"square: {out}", text, count=1, flags=re.M)
            else:
                text = text.replace(f"cover: {m.group(1)}", f"cover: {m.group(1)}\nsquare: {out}", 1)
            open(path, "w", encoding="utf-8").write(text)
            made += 1
    print(f"{made} 张方图")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
