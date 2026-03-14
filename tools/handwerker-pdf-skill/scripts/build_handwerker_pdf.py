#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import math
import os
import re
import textwrap
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps


VERSION = "0.2.0"
PAGE_WIDTH = 1654
PAGE_HEIGHT = 2339
MARGIN = 110
GAP = 28
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

IMAGE_OVERRIDES = {
    "bad": {
        "before": "assets/rooms/bad/medien/ist/vorher.png",
        "after": "assets/rooms/bad/medien/inspiration/titel.png",
    },
    "wc": {
        "before": "assets/rooms/wc/medien/ist/gaestebad_ist.png",
        "after": "assets/rooms/wc/medien/inspiration/titel.jpg",
    },
    "flur": {
        "before": "assets/rooms/flur/medien/ist/flur_ansicht_eingang.jpg",
        "after": "assets/rooms/flur/medien/plan/grundriss_gesamt.png",
    },
    "wohnraum": {
        "before": "assets/rooms/wohnraum/medien/ist/wohnzimmer_1.jpeg",
        "after": "assets/rooms/wohnraum/medien/plan/grundriss_gesamt.png",
    },
    "kellerflur": {
        "before": "assets/rooms/kellerflur/medien/ist/kellerflur_ansicht_eingang.jpg",
        "after": "assets/rooms/kellerflur/medien/plan/grundriss_keller.JPG",
    },
    "keller_buero": {
        "before": "assets/rooms/keller_buero/medien/ist/ist2.png",
        "after": "assets/rooms/keller_buero/medien/inspiration/soll.png",
    },
    "schlafzimmer": {
        "before": "assets/rooms/schlafzimmer/medien/ist/schlafzimmer_vorher.png",
        "after": "assets/rooms/schlafzimmer/medien/inspiration/schlafzimmer_nachher.png",
    },
}


@dataclass
class Room:
    id: str
    name: str
    area: float
    area_derivation: str
    status: str
    path: str


@dataclass
class MaterialRef:
    label: str
    details: str


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


def find_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for candidate in FONT_CANDIDATES:
        if os.path.exists(candidate):
            try:
                return ImageFont.truetype(candidate, size=size)
            except OSError:
                continue
    return ImageFont.load_default()


def format_area(area: float) -> str:
    if math.isclose(area, round(area)):
        return str(int(round(area)))
    return f"{area:.2f}".replace(".", ",")


def pick_rooms(all_rooms: list[Room], room_ids: list[str] | None, include_finished: bool) -> list[Room]:
    ordered = all_rooms
    if room_ids:
        order = {room_id: index for index, room_id in enumerate(room_ids)}
        ordered = [room for room in all_rooms if room.id in order]
        ordered.sort(key=lambda room: order[room.id])
    if not include_finished:
        ordered = [room for room in ordered if room.status != "Fertig"]
    return ordered


def is_placeholder(rel_path: str) -> bool:
    return "_placeholder" in rel_path.casefold()


def resolve_rel_path(project_root: Path, rel_path: str) -> Path | None:
    path = project_root / "apps/hausplanung/public" / rel_path
    return path if path.exists() else None


def score_image(rel_path: str, preferred_tokens: list[str], discouraged_tokens: list[str] | None = None) -> int:
    discouraged_tokens = discouraged_tokens or []
    name = rel_path.casefold()
    score = 0
    for token in preferred_tokens:
        if token in name:
            score += 10
    for token in discouraged_tokens:
        if token in name:
            score -= 4
    return score


def pick_best_image(
    project_root: Path,
    rel_paths: list[str],
    preferred_tokens: list[str],
    discouraged_tokens: list[str] | None = None,
    require_positive_score: bool = False,
) -> Path | None:
    candidates: list[tuple[int, int, Path]] = []
    for index, rel_path in enumerate(rel_paths):
        if is_placeholder(rel_path):
            continue
        path = resolve_rel_path(project_root, rel_path)
        if path is None:
            continue
        score = score_image(rel_path, preferred_tokens, discouraged_tokens)
        candidates.append((score, -index, path))

    if not candidates:
        return None

    best_score, _, best_path = max(candidates)
    if require_positive_score and best_score <= 0:
        return None
    return best_path


def resolve_images(image_paths: list[str], room_id: str, project_root: Path) -> tuple[Path | None, Path | None]:
    override = IMAGE_OVERRIDES.get(room_id, {})
    before_override = override.get("before")
    after_override = override.get("after")
    if before_override:
        before_path = resolve_rel_path(project_root, before_override)
    else:
        before_path = None
    if after_override:
        after_path = resolve_rel_path(project_root, after_override)
    else:
        after_path = None

    if before_path is None:
        before_path = pick_best_image(
            project_root,
            [path for path in image_paths if "/ist/" in path],
            preferred_tokens=["vorher", "bestand", "ansicht", "eingang", "ist"],
            discouraged_tokens=["detail"],
        )

    if after_path is None:
        after_path = pick_best_image(
            project_root,
            [path for path in image_paths if "/inspiration/" in path],
            preferred_tokens=["nachher", "soll", "titel", "inspiration"],
            discouraged_tokens=["detail"],
            require_positive_score=True,
        )

    if after_path is None:
        after_path = pick_best_image(
            project_root,
            [path for path in image_paths if "/plan/" in path],
            preferred_tokens=["grundriss_gesamt", "grundriss", "ausschnitt", "plan"],
            discouraged_tokens=["detail"],
        )

    return before_path, after_path


def select_plan_images(project_root: Path, image_paths: list[str], max_items: int = 2) -> list[Path]:
    scored: list[tuple[int, int, Path]] = []
    for index, rel_path in enumerate(image_paths):
        if "/plan/" not in rel_path or is_placeholder(rel_path):
            continue
        path = resolve_rel_path(project_root, rel_path)
        if path is None:
            continue
        score = score_image(
            rel_path,
            preferred_tokens=["grundriss_ausschnitt", "grundriss", "plan", "gesamt"],
            discouraged_tokens=["detail"],
        )
        scored.append((score, -index, path))
    scored.sort(reverse=True)
    return [path for _, _, path in scored[:max_items]]


def select_bestand_images(project_root: Path, image_paths: list[str], max_items: int = 4) -> list[Path]:
    scored: list[tuple[int, int, Path]] = []
    for index, rel_path in enumerate(image_paths):
        if "/ist/" not in rel_path or is_placeholder(rel_path):
            continue
        path = resolve_rel_path(project_root, rel_path)
        if path is None:
            continue
        score = score_image(
            rel_path,
            preferred_tokens=["vorher", "ansicht", "eingang", "wohnzimmer", "ist"],
            discouraged_tokens=["detail"],
        )
        scored.append((score, -index, path))
    scored.sort(reverse=True)
    return [path for _, _, path in scored[:max_items]]


def collect_material_refs(project_root: Path, materials_map: dict, room_id: str, max_items: int = 4) -> list[MaterialRef]:
    refs: list[MaterialRef] = []
    for item in materials_map.get(room_id, []):
        image_path = item.get("image")
        if not image_path or is_placeholder(image_path):
            continue
        if resolve_rel_path(project_root, image_path) is None:
            continue

        parts = [item.get("brand", "").strip(), item.get("name", "").strip()]
        label = " ".join(part for part in parts if part).strip()
        specs = item.get("specs", "").strip()
        details_parts = [segment for segment in [specs, item.get("price", "").strip(), item.get("shop", "").strip()] if segment]
        refs.append(MaterialRef(label=label or item.get("name", "Produkt"), details=" | ".join(details_parts)))
        if len(refs) >= max_items:
            break
    return refs


def clean_text(text: str) -> str:
    text = text.replace("&", "und")
    text = re.sub(r"\s+", " ", text).strip()
    return text


def summarize_task(title: str, description: str | None = None) -> str:
    if description:
        return clean_text(description)

    title = clean_text(title)
    if ":" not in title:
        return title

    category, detail = [part.strip() for part in title.split(":", 1)]
    category_lower = category.casefold()
    detail = clean_text(detail)

    if category_lower == "demontage":
        return f"{detail} demontieren"
    if category_lower == "vorbereitung":
        return detail
    if category_lower == "abriss":
        return detail.replace("rausreißen", "entfernen")
    if category_lower == "elektro":
        return detail
    return detail or title


def extract_offer_work_items(planung: dict) -> list[str]:
    items: list[str] = []
    for section in planung.get("sections", []):
        title = str(section.get("title", "")).upper()
        section_type = section.get("type")
        section_items = section.get("items")

        if section_type == "table" and isinstance(section_items, dict) and (
            "ABLAUFPLAN" in title or "RENOVIERUNGS-ABLAUF" in title or "RENOVIERUNGSABLAUF" in title
        ):
            headers = [str(header) for header in section_items.get("headers", [])]
            rows = section_items.get("rows", [])
            status_idx = next((idx for idx, header in enumerate(headers) if "STATUS" in header.upper()), -1)
            title_idx = next(
                (idx for idx, header in enumerate(headers) if any(token in header.upper() for token in ("TITEL", "SCHRITT", "GEWERK"))),
                0,
            )
            description_idx = next((idx for idx, header in enumerate(headers) if "BESCHREIB" in header.upper()), -1)

            for row in rows:
                if not isinstance(row, list) or not row:
                    continue
                status = str(row[status_idx]).strip().lower() if status_idx != -1 and status_idx < len(row) else ""
                if status in {"fertig", "erledigt", "✅ fertig"}:
                    continue
                raw_title = str(row[title_idx]).strip() if title_idx < len(row) else ""
                raw_description = str(row[description_idx]).strip() if description_idx != -1 and description_idx < len(row) else ""
                label = summarize_task(raw_title, raw_description or None)
                if label:
                    items.append(label)

        if section_type == "checklist" and isinstance(section_items, list):
            for item in section_items:
                if not isinstance(item, dict) or item.get("done") is True:
                    continue
                label = summarize_task(str(item.get("label", "")).strip())
                if label:
                    items.append(label)

    deduped: list[str] = []
    seen: set[str] = set()
    for item in items:
        key = item.casefold()
        if key in seen:
            continue
        seen.add(key)
        deduped.append(item)
    return deduped[:6] if deduped else ["Leistungsumfang manuell abstimmen"]


def fit_image(path: Path, size: tuple[int, int]) -> Image.Image:
    with Image.open(path) as raw:
        image = ImageOps.exif_transpose(raw).convert("RGB")
    return ImageOps.fit(image, size, method=Image.Resampling.LANCZOS)


def draw_wrapped_lines(
    draw: ImageDraw.ImageDraw,
    lines: list[str],
    font,
    fill: str,
    x: int,
    y: int,
    width: int,
    line_spacing: int = 8,
    bullet: bool = False,
) -> int:
    average_width = max(font.getbbox("abcdefghijklmnopqrstuvwxyz")[2] / 26, 7)
    wrap_width = max(12, int(width / average_width))
    cursor_y = y

    for line in lines:
        wrapped = textwrap.wrap(line, width=wrap_width) or [""]
        for index, part in enumerate(wrapped):
            prefix = "• " if bullet and index == 0 else "  " if bullet else ""
            draw.text((x, cursor_y), prefix + part, font=font, fill=fill)
            cursor_y += font.getbbox(part or "Ag")[3] + line_spacing
        cursor_y += 10
    return cursor_y


def draw_card(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int]) -> None:
    draw.rounded_rectangle(box, radius=28, fill=CARD, outline=LINE, width=2)


def render_briefing_page(
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

    draw_card(draw, (MARGIN, MARGIN, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - MARGIN))
    draw.text((MARGIN + 70, MARGIN + 62), title, font=title_font, fill=TEXT)
    if subtitle:
        draw.text((MARGIN + 72, MARGIN + 150), subtitle, font=meta_font, fill=MUTED)

    draw.text((MARGIN + 70, MARGIN + 250), room.name, font=room_font, fill=TEXT)
    meta_text = f"{format_area(room.area)} m² | {room.area_derivation}".strip(" |")
    draw.text((MARGIN + 72, MARGIN + 365), meta_text, font=meta_font, fill=MUTED)
    draw.line((MARGIN + 70, MARGIN + 430, PAGE_WIDTH - MARGIN - 70, MARGIN + 430), fill=LINE, width=3)

    image_top = MARGIN + 474
    image_width = (PAGE_WIDTH - (2 * MARGIN) - 70 * 2 - GAP) // 2
    image_height = 820
    left_box = (MARGIN + 70, image_top, MARGIN + 70 + image_width, image_top + image_height)
    right_box = (left_box[2] + GAP, image_top, left_box[2] + GAP + image_width, image_top + image_height)

    if before_path:
        page.paste(fit_image(before_path, (image_width, image_height)), (left_box[0], left_box[1]))
    else:
        draw_card(draw, left_box)
        draw.text(((left_box[0] + left_box[2]) // 2, (left_box[1] + left_box[3]) // 2), "Kein Bild", anchor="mm", font=body_small_font, fill=MUTED)

    if after_path:
        page.paste(fit_image(after_path, (image_width, image_height)), (right_box[0], right_box[1]))
    else:
        draw_card(draw, right_box)
        draw.text(((right_box[0] + right_box[2]) // 2, (right_box[1] + right_box[3]) // 2), "Kein Bild", anchor="mm", font=body_small_font, fill=MUTED)

    draw.text((left_box[0] + 24, left_box[1] + 18), "Vorher", font=label_font, fill=TEXT)
    draw.text((right_box[0] + 24, right_box[1] + 18), "Nachher", font=label_font, fill=TEXT)

    tasks_top = image_top + image_height + 70
    draw.text((MARGIN + 70, tasks_top), "Was zu tun ist", font=title_font, fill=TEXT)
    draw.text((PAGE_WIDTH - MARGIN - 70, tasks_top + 16), room.status, anchor="ra", font=meta_font, fill=ACCENT)
    draw_wrapped_lines(draw, tasks, body_font, TEXT, MARGIN + 92, tasks_top + 98, PAGE_WIDTH - 2 * MARGIN - 160, line_spacing=10, bullet=True)

    footer_y = PAGE_HEIGHT - MARGIN - 70
    draw.line((MARGIN + 70, footer_y, PAGE_WIDTH - MARGIN - 70, footer_y), fill=LINE, width=2)
    draw.text((MARGIN + 70, footer_y + 18), "Handwerkerbriefing", font=label_font, fill=MUTED)
    draw.text((PAGE_WIDTH - MARGIN - 70, footer_y + 18), f"Seite {page_number}", anchor="ra", font=label_font, fill=MUTED)
    return page


def render_offer_cover(title: str, room_names: list[str]) -> Image.Image:
    page = Image.new("RGB", (PAGE_WIDTH, PAGE_HEIGHT), BG)
    draw = ImageDraw.Draw(page)

    overline_font = find_font(28)
    title_font = find_font(96)
    body_font = find_font(40)
    small_font = find_font(30)

    draw_card(draw, (MARGIN, MARGIN, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - MARGIN))
    draw.text((MARGIN + 90, MARGIN + 120), f"Version {VERSION}", font=overline_font, fill=ACCENT)
    draw.text((MARGIN + 90, MARGIN + 220), title, font=title_font, fill=TEXT)
    draw.line((MARGIN + 90, MARGIN + 470, PAGE_WIDTH - MARGIN - 90, MARGIN + 470), fill=LINE, width=3)
    draw.text((MARGIN + 90, MARGIN + 560), "Enthaltene Räume", font=body_font, fill=TEXT)
    draw_wrapped_lines(draw, room_names, body_font, TEXT, MARGIN + 100, MARGIN + 650, PAGE_WIDTH - 2 * MARGIN - 180, line_spacing=12, bullet=True)

    note = [
        "Grundlage für die Angebotserstellung.",
        "Fokus auf Maße, Bestand, Planunterlagen und gewünschte Leistungen.",
        "Platzhalterbilder und nicht belastbare Zusatzannahmen wurden ausgeschlossen.",
    ]
    draw.text((MARGIN + 90, MARGIN + 1180), "Hinweis", font=body_font, fill=TEXT)
    draw_wrapped_lines(draw, note, small_font, MUTED, MARGIN + 100, MARGIN + 1260, PAGE_WIDTH - 2 * MARGIN - 180, line_spacing=10, bullet=True)
    draw.text((MARGIN + 90, PAGE_HEIGHT - MARGIN - 120), "Sauerbruch 3", font=small_font, fill=MUTED)
    return page


def render_offer_room_page(
    document_title: str,
    room: Room,
    tasks: list[str],
    plan_images: list[Path],
    bestand_images: list[Path],
    materials: list[MaterialRef],
    page_number: int,
) -> Image.Image:
    page = Image.new("RGB", (PAGE_WIDTH, PAGE_HEIGHT), BG)
    draw = ImageDraw.Draw(page)

    header_font = find_font(26)
    room_font = find_font(76)
    meta_font = find_font(32)
    section_font = find_font(32)
    body_font = find_font(26)
    small_font = find_font(24)

    draw_card(draw, (MARGIN, MARGIN, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - MARGIN))
    draw.text((MARGIN + 70, MARGIN + 62), document_title, font=header_font, fill=MUTED)
    draw.text((PAGE_WIDTH - MARGIN - 70, MARGIN + 62), room.status, anchor="ra", font=header_font, fill=ACCENT)
    draw.text((MARGIN + 70, MARGIN + 140), room.name, font=room_font, fill=TEXT)
    draw.text((MARGIN + 72, MARGIN + 246), f"Fläche: {format_area(room.area)} m²", font=meta_font, fill=TEXT)
    if room.area_derivation:
        draw.text((MARGIN + 72, MARGIN + 298), f"Herleitung: {room.area_derivation}", font=meta_font, fill=MUTED)

    content_x1 = MARGIN + 70
    content_x2 = PAGE_WIDTH - MARGIN - 70
    y = MARGIN + 370

    work_box = (content_x1, y, content_x2, y + 360)
    draw_card(draw, work_box)
    draw.text((work_box[0] + 28, work_box[1] + 24), "Geplanter Leistungsumfang", font=section_font, fill=TEXT)
    draw_wrapped_lines(draw, tasks, body_font, TEXT, work_box[0] + 34, work_box[1] + 90, work_box[2] - work_box[0] - 60, line_spacing=8, bullet=True)
    y = work_box[3] + GAP

    if plan_images:
        plan_box = (content_x1, y, content_x2, y + 280)
        draw_card(draw, plan_box)
        draw.text((plan_box[0] + 28, plan_box[1] + 24), "Grundriss / Planausschnitt", font=section_font, fill=TEXT)
        image_y = plan_box[1] + 78
        usable_width = plan_box[2] - plan_box[0] - 56
        plan_width = (usable_width - GAP) // max(len(plan_images), 1)
        for index, path in enumerate(plan_images[:2]):
            x = plan_box[0] + 28 + index * (plan_width + GAP)
            tile_height = 165
            page.paste(fit_image(path, (plan_width, tile_height)), (x, image_y))
        y = plan_box[3] + GAP

    if bestand_images:
        rows = 2 if len(bestand_images) > 2 else 1
        cols = 2 if len(bestand_images) == 2 else min(3, len(bestand_images))
        photo_height = 230 if rows == 1 else 210
        grid_height = 110 + rows * photo_height + (rows - 1) * GAP + 20
        bestand_box = (content_x1, y, content_x2, y + grid_height)
        draw_card(draw, bestand_box)
        draw.text((bestand_box[0] + 28, bestand_box[1] + 24), "Bestandsfotos", font=section_font, fill=TEXT)
        usable_width = bestand_box[2] - bestand_box[0] - 56
        tile_width = (usable_width - GAP * (cols - 1)) // cols
        start_y = bestand_box[1] + 78
        for index, path in enumerate(bestand_images):
            row = index // cols
            col = index % cols
            x = bestand_box[0] + 28 + col * (tile_width + GAP)
            image_y = start_y + row * (photo_height + GAP)
            page.paste(fit_image(path, (tile_width, photo_height)), (x, image_y))
        y = bestand_box[3] + GAP

    if materials:
        material_height = 210
        material_box = (content_x1, y, content_x2, y + material_height)
        draw_card(draw, material_box)
        draw.text((material_box[0] + 28, material_box[1] + 24), "Material- / Produktreferenzen", font=section_font, fill=TEXT)
        lines = [f"{item.label}: {item.details}" if item.details else item.label for item in materials]
        draw_wrapped_lines(draw, lines, small_font, TEXT, material_box[0] + 34, material_box[1] + 82, material_box[2] - material_box[0] - 60, line_spacing=6, bullet=True)

    footer_y = PAGE_HEIGHT - MARGIN - 70
    draw.line((content_x1, footer_y, content_x2, footer_y), fill=LINE, width=2)
    draw.text((content_x1, footer_y + 18), f"Angebotsunterlagen | Seite {page_number}", font=small_font, fill=MUTED)
    return page


def default_title(rooms: list[Room], document_type: str) -> str:
    if document_type == "angebot":
        names = [room.name for room in rooms]
        if names == ["Bad", "Gästebad", "Flur"]:
            return "Angebotsunterlagen Bad, Gästebad und Flur"
        if len(names) == 1:
            return f"Angebotsunterlagen {names[0]}"
        if len(names) == 2:
            return f"Angebotsunterlagen {names[0]} und {names[1]}"
        return f"Angebotsunterlagen {', '.join(names[:-1])} und {names[-1]}"
    return "Sauerbruch 3 | Handwerkerbriefing"


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Build contractor PDFs from Sauerbruch room planning data.")
    parser.add_argument("--project-root", required=True, help="Root of the Sauerbruch repository.")
    parser.add_argument("--output", required=True, help="Target PDF path.")
    parser.add_argument("--rooms", help="Comma-separated room ids to include.")
    parser.add_argument("--title", default=None)
    parser.add_argument("--subtitle", default=None)
    parser.add_argument("--include-finished", action="store_true")
    parser.add_argument("--document-type", choices=["briefing", "angebot"], default="briefing")
    parser.add_argument("--debug-image-selection", action="store_true")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    project_root = Path(args.project_root).expanduser().resolve()
    output_path = Path(args.output).expanduser().resolve()
    room_filter = [item.strip() for item in args.rooms.split(",") if item.strip()] if args.rooms else None

    data_root = project_root / "apps/hausplanung/public/assets/data"
    rooms_raw = load_json(data_root / "rooms.json")
    images_map = load_json(data_root / "images.json")
    materials_map = load_json(data_root / "materials.json")
    rooms = [room_from_dict(item) for item in rooms_raw]
    selected_rooms = pick_rooms(rooms, room_filter, args.include_finished)

    if not selected_rooms:
        raise SystemExit("No rooms selected for export.")

    title = args.title or default_title(selected_rooms, args.document_type)
    pages: list[Image.Image] = []

    if args.document_type == "angebot":
        pages.append(render_offer_cover(title, [room.name for room in selected_rooms]))

    for index, room in enumerate(selected_rooms, start=1):
        planung = load_json(project_root / "apps/hausplanung/public/assets" / room.path)
        image_paths = images_map.get(room.id, [])
        before_path, after_path = resolve_images(image_paths, room.id, project_root)

        if args.debug_image_selection:
            print(f"{room.id}: before={before_path} after={after_path}")

        if args.document_type == "angebot":
            tasks = extract_offer_work_items(planung)
            plan_images = select_plan_images(project_root, image_paths, max_items=2)
            bestand_images = select_bestand_images(project_root, image_paths, max_items=4)
            materials = collect_material_refs(project_root, materials_map, room.id, max_items=4)
            page = render_offer_room_page(title, room, tasks, plan_images, bestand_images, materials, page_number=index + 1)
        else:
            tasks = extract_offer_work_items(planung)
            page = render_briefing_page(title, args.subtitle, room, before_path, after_path, tasks, page_number=index)

        pages.append(page)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    first, rest = pages[0], pages[1:]
    first.save(output_path, "PDF", resolution=150.0, save_all=True, append_images=rest)
    print(f"Created PDF: {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
