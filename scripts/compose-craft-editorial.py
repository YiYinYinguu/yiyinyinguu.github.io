#!/usr/bin/env python3
"""Place an approved landscape craft panel on a square paper canvas."""

from __future__ import annotations

import argparse
import statistics
from pathlib import Path

from PIL import Image, ImageDraw, ImageOps


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Create a square, abstract-only Craft editorial cover."
    )
    parser.add_argument("--panel", required=True, type=Path)
    parser.add_argument("--out", required=True, type=Path)
    parser.add_argument("--width", type=int, default=1024)
    parser.add_argument("--height", type=int, default=1024)
    parser.add_argument("--panel-width", type=int, default=1024)
    parser.add_argument("--feather", type=int, default=52)
    return parser.parse_args()


def paper_color(image: Image.Image) -> tuple[int, int, int]:
    """Estimate the paper color from small samples in all four corners."""
    sample = min(96, image.width // 8, image.height // 8)
    boxes = (
        (0, 0, sample, sample),
        (image.width - sample, 0, image.width, sample),
        (0, image.height - sample, sample, image.height),
        (image.width - sample, image.height - sample, image.width, image.height),
    )
    pixels: list[tuple[int, int, int]] = []
    for box in boxes:
        reduced = image.crop(box).resize((20, 20))
        pixels.extend(
            reduced.getpixel((x, y))
            for y in range(reduced.height)
            for x in range(reduced.width)
        )
    return tuple(round(statistics.median(p[channel] for p in pixels)) for channel in range(3))


def paper_canvas(size: tuple[int, int], color: tuple[int, int, int]) -> Image.Image:
    """Build a quiet paper field with fine tonal variation instead of a flat pad."""
    low = tuple(max(0, value - 3) for value in color)
    high = tuple(min(255, value + 3) for value in color)
    noise = Image.effect_noise(size, 2.1).convert("L")
    return ImageOps.colorize(noise, low, high)


def feather_mask(size: tuple[int, int], amount: int) -> Image.Image:
    """Soften only the panel's top and bottom paper edges into the tall canvas."""
    width, height = size
    amount = max(0, min(amount, height // 3))
    mask = Image.new("L", size, 255)
    if amount == 0:
        return mask
    draw = ImageDraw.Draw(mask)
    for offset in range(amount):
        alpha = round(255 * (offset + 1) / amount)
        draw.line((0, offset, width, offset), fill=alpha)
        draw.line((0, height - 1 - offset, width, height - 1 - offset), fill=alpha)
    return mask


def main() -> None:
    args = parse_args()
    if not args.panel.is_file():
        raise SystemExit(f"panel not found: {args.panel}")
    if args.width <= 0 or args.height <= 0 or not 0 < args.panel_width <= args.width:
        raise SystemExit("invalid canvas or panel width")

    with Image.open(args.panel) as opened:
        panel = ImageOps.exif_transpose(opened).convert("RGB")
    if panel.width <= panel.height:
        raise SystemExit("panel must be landscape")

    fitted = ImageOps.contain(
        panel,
        (args.panel_width, args.height),
        Image.Resampling.LANCZOS,
    )
    canvas = paper_canvas((args.width, args.height), paper_color(panel))
    left = (args.width - fitted.width) // 2
    top = (args.height - fitted.height) // 2
    canvas.paste(fitted, (left, top), feather_mask(fitted.size, args.feather))

    args.out.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(args.out, format="PNG", optimize=True)
    print(f"saved {args.out} ({args.width}x{args.height}; panel={fitted.width}x{fitted.height})")


if __name__ == "__main__":
    main()
