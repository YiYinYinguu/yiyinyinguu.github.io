#!/usr/bin/env python3
"""扫描 Life 内容里实际用到的字，生成手账字体子集。

手账样式用「马善政毛笔楷书」。完整字库 5.6MB，但网页只需要真正出现过的
那几百个字，子集化后通常不到 100KB。

什么时候要重跑：写了新标题、新心得，出现了以前没用过的字。忘了跑的话，
新字会掉回系统默认字体（不会消失，只是不像手写）。

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
UI_TEXT = "烘焙编织生活手账年月日第次记录全部中式西最新早在前这里还没有呢张关闭下一食谱厨房做过多"
# 拉丁字母和数字交给 Alegreya 渲染（见 globals.css 的 .journal-hand），
# 这个字体只负责中文，所以不必把英文塞进子集
PUNCT = "#·，。！？、；：（）“”‘’—…《》：/-. "


def collect_chars() -> str:
    chars = set(UI_TEXT + PUNCT)
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
