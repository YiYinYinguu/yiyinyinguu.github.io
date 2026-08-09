#!/bin/bash
# 把照片压缩、改名、放进 public/life/<板块>/，并打印可直接粘贴的 markdown。
#
# 用法:
#   ./scripts/add-life-photos.sh <板块> <作品slug> <图片...>
#
# 例:
#   ./scripts/add-life-photos.sh baking basque-cheesecake ~/Desktop/照片/*.jpg
#
# 结果: public/life/baking/basque-cheesecake-1.jpg, -2.jpg ...
# 依赖 macOS 自带的 sips，无需安装任何东西。

set -euo pipefail

MAX_EDGE=1600   # 最长边像素，网页显示足够
QUALITY=72      # JPEG 质量，肉眼几乎无差别

if [ $# -lt 3 ]; then
  echo "用法: $0 <板块> <作品slug> <图片...>"
  echo "例:   $0 baking basque-cheesecake ~/Desktop/照片/*.jpg"
  exit 1
fi

CATEGORY="$1"; shift
SLUG="$1"; shift

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$ROOT/public/life/$CATEGORY"

if [ ! -d "$DEST" ]; then
  echo "板块目录不存在: public/life/$CATEGORY"
  echo "现有板块: $(ls "$ROOT/public/life" 2>/dev/null | tr '\n' ' ')"
  echo "如果是新板块，记得同时在 config/site.ts 的 lifeCategories 里加一条。"
  exit 1
fi

# 从已有文件续编号，避免覆盖同一作品早先加过的图
n=0
while [ -f "$DEST/$SLUG-$((n + 1)).jpg" ]; do n=$((n + 1)); done
start=$n

total_before=0
total_after=0

for src in "$@"; do
  [ -f "$src" ] || { echo "跳过（不是文件）: $src"; continue; }
  n=$((n + 1))
  out="$DEST/$SLUG-$n.jpg"

  before=$(stat -f%z "$src")
  # 统一转成 jpg、限制最长边、压缩质量；-s format 处理 HEIC/PNG 等各种来源
  sips -s format jpeg -s formatOptions "$QUALITY" -Z "$MAX_EDGE" "$src" --out "$out" >/dev/null
  after=$(stat -f%z "$out")

  total_before=$((total_before + before))
  total_after=$((total_after + after))
  printf "  %-28s %5sKB → %4sKB\n" "$SLUG-$n.jpg" "$((before / 1024))" "$((after / 1024))"
done

added=$((n - start))
[ "$added" -gt 0 ] || { echo "没有处理任何图片。"; exit 1; }

echo ""
echo "已处理 $added 张，总计 $((total_before / 1024 / 1024))MB → $((total_after / 1024))KB"
echo ""
echo "--- 复制到 content/life/$CATEGORY/$SLUG.md ---"
echo ""
echo "---"
echo "title: 在这里写标题"
echo "date: $(date +%Y-%m-%d)"
echo "cover: /life/$CATEGORY/$SLUG-$((start + 1)).jpg"
echo "---"
echo ""
i=$((start + 1))
while [ "$i" -le "$n" ]; do
  echo "![](/life/$CATEGORY/$SLUG-$i.jpg)"
  i=$((i + 1))
done
