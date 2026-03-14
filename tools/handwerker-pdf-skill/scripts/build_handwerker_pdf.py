#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import math
import os
import textwrap
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

from PIL import Image, ImageDraw, ImageFont, ImageOps


PAGE_WIDTH = 1654
PAGE_HEIGHT = 2339
MARGIN = 110
HEADER_HEIGHT = 250
FOOTER_HEIGHT = 70
GAP = 32
BG = "#f5f2ea"
CARD = "#fbf9f4"
TEXT = "#171717"
MUTED = "#6b665d"
LINE = "#d8d1c5"
ACCENT = "#c6b299"
FONT_CANDIDATES = [
    "/System/Library/Fonts/Supplemental/Helvetica.ttc",
    "/System/Library/Fonts/Supplemental/Arial.ttf",
    "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
    "/Library/Fonts/Arial.ttf",
]


@dataclass
class Room:
    id: str
    name: str
    area: float
    area_derivation: str
    status: str
    path: str


def room_from_dict(data: dict) -> Room:
    return Room(
        id=data["id"],
        name=data["name"],
        area=float(data["area"]),
        area_derivation=data.get("area_derivation", ""),
        status=data.get("status", ""),
        path=data["path"],
    )


def load_json(path: Path):
    with path.open("r", encoding="utf-8") as fh:
        return json.load(fh)


def find_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for candidate in FONT_CANDIDATES:
        if os.path.exists(candidate):
            try:
                return ImageFont.truetype(candidate, size=size)
            except OSError:
                continue
    return ImageFont.load_default()


def pick_rooms(all_rooms: list[Room], room_ids: set[str] | None, include_finished: bool) -> list[Room]:
    rooms = all_rooms
    if room_ids:
        rooms = [room for room in rooms if room.id in room_ids]
    if not include_finished:
        rooms = [room for room in rooms if room.status != "Fertig"]
    return rooms


def extract_task_titles(planung: dict) -> list[str]:
    tasks: list[str] = []
    for section in planung.get("sections", []):
        title = str(section.get("title", "")).upper()
        items = section.get("items")
        section_type = section.get("type")

        if section_type == "table" and isinstance(items, dict) and (
            "ABLAUFPLAN" in title or "RENOVIERUNGS-ABLAUF" in title or "RENOVIERUNGSABLAUF" in title
        ):
            headers = [str(h) for h in items.get("headers", [])]
            rows = items.get("rows", [])
            status_idx = next((i for i, h in enumerate(headers) if "STATUS" in h.upper()), -1)
            title_idx = next(
                (
                    i
                    for i, h in enumerate(headers)
                    if any(token in h.upper() for token in ("TITEL", "SCHRITT", "GEWERK"))
                ),
                0,
            )
            for row in rows:
                if not isinstance(row, list) or not row:
                    continue
                status = str(row[status_idx]).strip().lower() if status_idx != -1 and status_idx < len(row) else ""
                done = status in {"fertig", "erledigt", "✅ fertig"}
                if done:
                    continue
                label = str(row[title_idx]).strip() if title_idx < len(row) else ""
                if label:
                    tasks.append(label)

        if section_type == "checklist" and isinstance(items, list):
            for item in items:
                if not isinstance(item, dict):
                    continue
                if item.get("done") is True:
                    continue
                label = str(item.get("label", "")).strip()
                if label:
                    tasks.append(label)

    deduped: list[str] = []
    seen: set[str] = set()
    for task in tasks:
        key = task.casefold()
        if key in seen:
            continue
        seen.add(key)
        deduped.append(task)
    return deduped[:8] if deduped else ["Leistungsumfang manuell abstimmen"]


def resolve_images(image_paths: list[str], project_root: Path) -> tuple[Path | None, Path | None]:
    before = pick_best_image(
        project_root,
        [p for p in image_paths if "/ist/" in p],
        preferred_tokens=["vorher", "bestand", "ist"],
        discouraged_tokens=["detail"],
    )
    after = pick_best_image(
        project_root,
        [p for p in image_paths if "/inspiration/" in p],
        preferred_tokens=["nachher", "soll", "inspiration", "titel"],
        discouraged_tokens=["detail"],
    )
    if after is None:
        after = pick_best_image(
            project_root,
            [p for p in image_paths if "/plan/" in p],
            preferred_tokens=["plan", "grundriss_ausschnitt", "grundriss", "gesamt"],
            discouraged_tokens=["detail"],
        )
    return before, after


def pick_best_image(
    project_root: Path,
    rel_paths: list[str],
    preferred_tokens: list[str],
    discouraged_tokens: list[str] | None = None,
) -> Path | None:
    discouraged_tokens = discouraged_tokens or []
    scored: list[tuple[int, int, str]] = []
    for index, rel in enumerate(rel_paths):
        path = project_root / "apps/hausplanung/public" / rel
        if not path.exists():
            continue
        name = rel.casefold()
        score = 0
        for token in preferred_tokens:
            if token in name:
                score += 10
        for token in discouraged_tokens:
            if token in name:
                score -= 3
        scored.append((score, -index, rel))

    if not scored:
        return None

    _, _, best_rel = max(scored)
    return project_root / "apps/hausplanung/public" / best_rel


def first_existing(project_root: Path, rel_paths: Iterable[str]) -> Path | None:
    for rel in rel_paths:
        path = project_root / "apps/hausplanung/public" / rel
        if path.exists():
            return path
    return None


def fit_image(path: Path, size: tuple[int, int]) -> Image.Image:
    with Image.open(path) as raw:
        image = ImageOps.exif_transpose(raw).convert("RGB")
    return ImageOps.fit(image, size, method=Image.Resampling.LANCZOS)


def draw_wrapped_text(draw: ImageDraw.ImageDraw, text: str, font, fill: str, box: tuple[int, int, int, int], line_spacing: int = 8) -> int:
    x1, y1, x2, y2 = box
    width = x2 - x1
    avg_char_width = max(font.getbbox("abcdefghijklmnopqrstuvwxyz")[2] / 26, 7)
    wrap_width = max(12, int(width / avg_char_width))
    lines: list[str] = []
    for paragraph in text.splitlines() or [""]:
        wrapped = textwrap.wrap(paragraph, width=wrap_width) or [""]
        lines.extend(wrapped)

    y = y1
    for line in lines:
        draw.text((x1, y), line, font=font, fill=fill)
        line_height = font.getbbox(line or "Ag")[3] + line_spacing
        y += line_height
        if y > y2:
            break
    return y


def draw_placeholder(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], label: str, small_font, big_font) -> None:
    draw.rounded_rectangle(box, radius=28, fill="#efe9df", outline=LINE, width=2)
    x1, y1, x2, y2 = box
    center = ((x1 + x2) // 2, (y1 + y2) // 2)
    draw.text((center[0], center[1] - 40), "Kein Bild", anchor="mm", font=big_font, fill=MUTED)
    draw.text((center[0], center[1] + 10), label, anchor="mm", font=small_font, fill=MUTED)


def render_page(
    title: str,
    subtitle: str | None,
    room: Room,
    before_path: Path | None,
    after_path: Path | None,
    tasks: list[str],
    page_number: int,
) -> Image.Image:
    page = Image.new("RGB", (PAGE_WIDTH, PAGE_HEIGHT), BG)
    draw = ImageDraw.Draw(page)

    title_font = find_font(74)
    room_font = find_font(92)
    meta_font = find_font(34)
    label_font = find_font(28)
    body_font = find_font(38)
    body_small_font = find_font(30)

    draw.rounded_rectangle(
        (MARGIN, MARGIN, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - MARGIN),
        radius=40,
        fill=CARD,
        outline=LINE,
        width=2,
    )

    draw.text((MARGIN + 70, MARGIN + 62), title, font=title_font, fill=TEXT)
    if subtitle:
        draw.text((MARGIN + 72, MARGIN + 150), subtitle, font=meta_font, fill=MUTED)

    draw.text((MARGIN + 70, MARGIN + HEADER_HEIGHT), room.name, font=room_font, fill=TEXT)
    area_text = f"{format_area(room.area)} m²"
    derivation = room.area_derivation.strip()
    meta_text = area_text if not derivation else f"{area_text} | {derivation}"
    draw.text((MARGIN + 72, MARGIN + HEADER_HEIGHT + 115), meta_text, font=meta_font, fill=MUTED)

    header_line_y = MARGIN + HEADER_HEIGHT + 180
    draw.line((MARGIN + 70, header_line_y, PAGE_WIDTH - MARGIN - 70, header_line_y), fill=LINE, width=3)

    image_top = header_line_y + 44
    image_width = (PAGE_WIDTH - (2 * MARGIN) - 70 * 2 - GAP) // 2
    image_height = 820
    left_box = (MARGIN + 70, image_top, MARGIN + 70 + image_width, image_top + image_height)
    right_box = (left_box[2] + GAP, image_top, left_box[2] + GAP + image_width, image_top + image_height)

    if before_path:
        page.paste(fit_image(before_path, (image_width, image_height)), (left_box[0], left_box[1]))
    else:
        draw_placeholder(draw, left_box, "Vorher", label_font, body_small_font)

    if after_path:
        page.paste(fit_image(after_path, (image_width, image_height)), (right_box[0], right_box[1]))
    else:
        draw_placeholder(draw, right_box, "Nachher", label_font, body_small_font)

    for box, label in ((left_box, "Vorher"), (right_box, "Nachher")):
        chip_box = (box[0] + 24, box[1] + 24, box[0] + 190, box[1] + 84)
        draw.rounded_rectangle(chip_box, radius=20, fill="#fffdf9", outline=LINE, width=2)
        draw.text((chip_box[0] + 83, chip_box[1] + 30), label, anchor="mm", font=label_font, fill=TEXT)

    tasks_top = image_top + image_height + 70
    draw.text((MARGIN + 70, tasks_top), "Was zu tun ist", font=title_font, fill=TEXT)
    draw.text(
        (PAGE_WIDTH - MARGIN - 70, tasks_top + 16),
        room.status,
        anchor="ra",
        font=meta_font,
        fill=ACCENT,
    )

    bullet_x = MARGIN + 92
    text_x = bullet_x + 42
    y = tasks_top + 98
    max_y = PAGE_HEIGHT - MARGIN - FOOTER_HEIGHT - 10
    for task in tasks:
        task_box = (text_x, y - 8, PAGE_WIDTH - MARGIN - 80, max_y)
        draw.ellipse((bullet_x, y + 12, bullet_x + 16, y + 28), fill=TEXT)
        next_y = draw_wrapped_text(draw, task, body_font, TEXT, task_box, line_spacing=10)
        y = next_y + 22
        if y > max_y:
            break

    footer_y = PAGE_HEIGHT - MARGIN - FOOTER_HEIGHT
    draw.line((MARGIN + 70, footer_y, PAGE_WIDTH - MARGIN - 70, footer_y), fill=LINE, width=2)
    draw.text((MARGIN + 70, footer_y + 18), "Handwerkerbriefing", font=label_font, fill=MUTED)
    draw.text((PAGE_WIDTH - MARGIN - 70, footer_y + 18), f"Seite {page_number}", anchor="ra", font=label_font, fill=MUTED)

    return page


def format_area(area: float) -> str:
    if math.isclose(area, round(area)):
        return str(int(round(area)))
    return f"{area:.2f}".replace(".", ",")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Build a minimalist contractor PDF from Sauerbruch room planning data.")
    parser.add_argument("--project-root", required=True, help="Root of the Sauerbruch repository.")
    parser.add_argument("--output", required=True, help="Target PDF path.")
    parser.add_argument("--rooms", help="Comma-separated room ids to include.")
    parser.add_argument("--title", default="Sauerbruch 3 | Handwerkerbriefing")
    parser.add_argument("--subtitle", default=None)
    parser.add_argument("--include-finished", action="store_true")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    project_root = Path(args.project_root).expanduser().resolve()
    output_path = Path(args.output).expanduser().resolve()
    room_filter = {item.strip() for item in args.rooms.split(",")} if args.rooms else None

    data_root = project_root / "apps/hausplanung/public/assets/data"
    rooms_raw = load_json(data_root / "rooms.json")
    images_map = load_json(data_root / "images.json")
    rooms = [room_from_dict(room) for room in rooms_raw]
    selected_rooms = pick_rooms(rooms, room_filter, args.include_finished)

    if not selected_rooms:
        raise SystemExit("No rooms selected for export.")

    pages: list[Image.Image] = []
    for index, room in enumerate(selected_rooms, start=1):
        planung = load_json(project_root / "apps/hausplanung/public/assets" / room.path)
        image_paths = images_map.get(room.id, [])
        before_path, after_path = resolve_images(image_paths, project_root)
        tasks = extract_task_titles(planung)
        page = render_page(args.title, args.subtitle, room, before_path, after_path, tasks, index)
        pages.append(page)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    first, rest = pages[0], pages[1:]
    first.save(output_path, "PDF", resolution=150.0, save_all=True, append_images=rest)
    print(f"Created PDF: {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
