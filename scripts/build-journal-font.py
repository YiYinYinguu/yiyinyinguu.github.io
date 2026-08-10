#!/usr/bin/env python3
"""生成手账字体子集：常用汉字 + 内容里实际出现的字。

手账样式用「马善政毛笔楷书」。完整字库压成 woff2 有 3.1MB，其中一大半是
生僻字和异体字。这里只取 GB2312 一级字库那 3755 个常用字（1.6MB），日常
能写的字都在里面，再并上 content 里实际用到的，写了生僻字也不会漏。

好处是平时不用管它：加菜名、写心得都不会掉字。只有换了字体源文件、或者
想调整覆盖范围时才需要重跑。

    python3 scripts/build-journal-font.py

部署用的 GitHub Actions 只有 Node 环境，所以产物 public/fonts/journal.woff2
必须提交进仓库，不能在 CI 里生成。
"""
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets", "fonts", "MaShanZheng-Regular.ttf")
OUT = os.path.join(ROOT, "public", "fonts", "journal.woff2")
CONTENT = os.path.join(ROOT, "content", "life")

# 界面上写死的文字（不在 markdown 里，但也要用手账字体渲染）
UI_TEXT = (
    "烘焙编织生活手账年月日第次记录全部中式西最新早在前"
    "这里还没有呢张关闭下一食谱厨房做过多列表历用料项收起"
    "二三四五六"  # 日历的星期栏
)
# 拉丁字母和数字交给 Alegreya 渲染（见 globals.css 的 .journal-hand），
# 这个字体只负责中文，所以不必把英文塞进子集
PUNCT = "#·，。！？、；：（）“”‘’—…《》：/-. "


def common_chars() -> set:
    """GB2312 一级字库，按拼音排的 3755 个常用字。"""
    out = set()
    for lead in range(0xB0, 0xD8):
        for tail in range(0xA1, 0xFF):
            try:
                out.add(bytes([lead, tail]).decode("gb2312"))
            except UnicodeDecodeError:
                pass
    return out


def collect_chars() -> str:
    chars = set(UI_TEXT + PUNCT) | common_chars()
    for dirpath, _, files in os.walk(CONTENT):
        for f in files:
            if not f.endswith(".md"):
                continue
            text = open(os.path.join(dirpath, f), encoding="utf-8").read()
            # 用料清单是用正文字体渲染的（见 JournalGrid 的 RecipeLine），
            # 放进来会凭空多出几百个字
            text = re.sub(r"^    ingredients:\n(?:      - .*\n)+", " ", text, flags=re.M)
            # 图片语法和 frontmatter 的键名不需要进字体
            text = re.sub(r"!\[[^\]]*\]\([^)]*\)", " ", text)
            text = re.sub(r"^(cover|thumb|square|date|title|note):", " ", text, flags=re.M)
            chars.update(text)
    # 只保留可见字符
    return "".join(sorted(c for c in chars if c.strip() and ord(c) > 31))


def main() -> int:
    if not os.path.exists(SRC):
        sys.exit(f"缺少字体源文件: {SRC}")
    try:
        subprocess.run(["pyftsubset", "--help"], capture_output=True, check=True)
    except (FileNotFoundError, subprocess.CalledProcessError):
        sys.exit("需要 fonttools：pip3 install 'fonttools[woff]' brotli")

    chars = collect_chars()
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    subprocess.run(
        ["pyftsubset", SRC, f"--text={chars}", f"--output-file={OUT}",
         "--flavor=woff2", "--layout-features=*"],
        check=True,
    )
    print(f"{len(chars)} 个字符 → {os.path.getsize(OUT) // 1024}KB  ({OUT})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
