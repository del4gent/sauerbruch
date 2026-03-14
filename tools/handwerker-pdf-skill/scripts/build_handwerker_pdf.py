#!/usr/bin/env python3

from __future__ import annotations

import argparse
import io
import json
import math
import os
import re
import textwrap
from datetime import date
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps
from reportlab.lib.colors import HexColor
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas


VERSION = "0.2.0"
PROJECT_URL = "https://del4gent.github.io/sauerbruch/"
PAGE_WIDTH = 1654
PAGE_HEIGHT = 2339
MARGIN = 110
GAP = 28
BG = "#ffffff"
CARD = "#ffffff"
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
            execution_idx = next(
                (idx for idx, header in enumerate(headers) if "AUSF" in header.upper() or "EXECUT" in header.upper()),
                -1,
            )
            title_idx = next(
                (idx for idx, header in enumerate(headers) if any(token in header.upper() for token in ("TITEL", "SCHRITT", "GEWERK"))),
                0,
            )
            description_idx = next((idx for idx, header in enumerate(headers) if "BESCHREIB" in header.upper()), -1)

            for row in rows:
                if not isinstance(row, list) or not row:
                    continue
                status = str(row[status_idx]).strip().lower() if status_idx != -1 and status_idx < len(row) else ""
                execution = str(row[execution_idx]).strip().lower() if execution_idx != -1 and execution_idx < len(row) else ""
                if status in {"fertig", "erledigt", "✅ fertig"}:
                    continue
                if "eigenleistung" in execution:
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
                execution = str(item.get("ausfuehrung", item.get("ausführung", item.get("execution", "")))).strip().lower()
                if "eigenleistung" in execution:
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
    title_font = find_font(88)
    body_font = find_font(40)
    small_font = find_font(26)

    draw_card(draw, (MARGIN, MARGIN, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - MARGIN))
    draw.rounded_rectangle((MARGIN + 90, MARGIN + 120, PAGE_WIDTH - MARGIN - 90, MARGIN + 250), radius=28, fill="#efe7da")
    draw.text((MARGIN + 120, MARGIN + 165), f"Angebotsunterlagen | Version {VERSION}", font=overline_font, fill="#7d6952")
    cover_title_lines = textwrap.wrap(title, width=28) or [title]
    title_y = MARGIN + 340
    for line in cover_title_lines:
        draw.text((MARGIN + 90, title_y), line, font=title_font, fill=TEXT)
        title_y += title_font.getbbox(line)[3] + 18
    draw.line((MARGIN + 90, title_y + 40, PAGE_WIDTH - MARGIN - 90, title_y + 40), fill=LINE, width=3)

    left_col_x = MARGIN + 90
    right_col_x = MARGIN + 820
    draw.text((left_col_x, title_y + 120), "Enthaltene Räume", font=body_font, fill=TEXT)
    draw_wrapped_lines(draw, room_names, body_font, TEXT, left_col_x, title_y + 210, 520, line_spacing=12, bullet=True)

    note = [
        "Grundlage für die Angebotserstellung.",
        "Fokus auf Maße, Bestand, Planunterlagen und gewünschte Leistungen.",
        "Platzhalterbilder und nicht belastbare Zusatzannahmen wurden ausgeschlossen.",
    ]
    note_box = (right_col_x - 30, title_y + 105, PAGE_WIDTH - MARGIN - 90, title_y + 600)
    draw.rounded_rectangle(note_box, radius=26, fill="#f7f2e8", outline=LINE, width=2)
    draw.text((note_box[0] + 30, note_box[1] + 28), "Hinweis", font=body_font, fill=TEXT)
    draw_wrapped_lines(draw, note, small_font, MUTED, note_box[0] + 30, note_box[1] + 105, note_box[2] - note_box[0] - 60, line_spacing=6, bullet=True)

    footer_box = (MARGIN + 90, PAGE_HEIGHT - MARGIN - 350, PAGE_WIDTH - MARGIN - 90, PAGE_HEIGHT - MARGIN - 170)
    draw.rounded_rectangle(footer_box, radius=26, fill="#f7f2e8", outline=LINE, width=2)
    draw.text((footer_box[0] + 30, footer_box[1] + 32), "Verwendungszweck", font=body_font, fill=TEXT)
    footer_lines = [
        "Projektinformationen für die Angebotseinholung.",
        "Je Raum: Maße, Bestand, Pläne und gewünschte Leistungen.",
    ]
    compact_font = find_font(26)
    draw_wrapped_lines(draw, footer_lines, compact_font, MUTED, footer_box[0] + 30, footer_box[1] + 94, footer_box[2] - footer_box[0] - 60, line_spacing=6, bullet=False)
    draw.text((MARGIN + 90, PAGE_HEIGHT - MARGIN - 70), "Sauerbruch 3", font=small_font, fill=MUTED)
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
    room_font = find_font(74)
    meta_font = find_font(30)
    section_font = find_font(30)
    body_font = find_font(26)
    small_font = find_font(23)

    draw_card(draw, (MARGIN, MARGIN, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - MARGIN))
    draw.text((MARGIN + 70, MARGIN + 62), document_title, font=header_font, fill=MUTED)
    draw.text((PAGE_WIDTH - MARGIN - 70, MARGIN + 62), room.status, anchor="ra", font=header_font, fill=ACCENT)
    draw.text((MARGIN + 70, MARGIN + 140), room.name, font=room_font, fill=TEXT)
    draw.text((MARGIN + 72, MARGIN + 246), f"Fläche: {format_area(room.area)} m²", font=meta_font, fill=TEXT)
    if room.area_derivation:
        draw.text((MARGIN + 72, MARGIN + 298), f"Herleitung: {room.area_derivation}", font=meta_font, fill=MUTED)

    content_top = MARGIN + 370
    left_x1 = MARGIN + 70
    left_x2 = MARGIN + 610
    right_x1 = left_x2 + GAP
    right_x2 = PAGE_WIDTH - MARGIN - 70

    work_box = (left_x1, content_top, left_x2, content_top + 520)
    draw_card(draw, work_box)
    draw.text((work_box[0] + 28, work_box[1] + 24), "Geplanter Leistungsumfang", font=section_font, fill=TEXT)
    draw_wrapped_lines(draw, tasks, body_font, TEXT, work_box[0] + 34, work_box[1] + 88, work_box[2] - work_box[0] - 60, line_spacing=8, bullet=True)

    if materials:
        material_box = (left_x1, work_box[3] + GAP, left_x2, work_box[3] + GAP + 410)
        draw_card(draw, material_box)
        draw.text((material_box[0] + 28, material_box[1] + 24), "Material- / Produktreferenzen", font=section_font, fill=TEXT)
        lines = [f"{item.label}: {item.details}" if item.details else item.label for item in materials]
        draw_wrapped_lines(draw, lines, small_font, TEXT, material_box[0] + 34, material_box[1] + 82, material_box[2] - material_box[0] - 60, line_spacing=6, bullet=True)

    plan_box = (right_x1, content_top, right_x2, content_top + 305)
    draw_card(draw, plan_box)
    draw.text((plan_box[0] + 28, plan_box[1] + 24), "Grundriss / Planausschnitt", font=section_font, fill=TEXT)
    if plan_images:
        image_y = plan_box[1] + 84
        usable_width = plan_box[2] - plan_box[0] - 56
        plan_width = (usable_width - GAP) // max(len(plan_images), 1)
        for index, path in enumerate(plan_images[:2]):
            x = plan_box[0] + 28 + index * (plan_width + GAP)
            tile_height = 185
            page.paste(fit_image(path, (plan_width, tile_height)), (x, image_y))

    if bestand_images:
        bestand_box = (right_x1, plan_box[3] + GAP, right_x2, plan_box[3] + GAP + 640)
        draw_card(draw, bestand_box)
        draw.text((bestand_box[0] + 28, bestand_box[1] + 24), "Bestandsfotos", font=section_font, fill=TEXT)
        rows = 2 if len(bestand_images) > 2 else 1
        cols = 2 if len(bestand_images) != 1 else 1
        photo_height = 220
        usable_width = bestand_box[2] - bestand_box[0] - 56
        tile_width = (usable_width - GAP * (cols - 1)) // cols
        start_y = bestand_box[1] + 84
        max_items = min(len(bestand_images), 4)
        for index, path in enumerate(bestand_images[:max_items]):
            row = index // cols
            col = index % cols
            x = bestand_box[0] + 28 + col * (tile_width + GAP)
            image_y = start_y + row * (photo_height + GAP)
            page.paste(fit_image(path, (tile_width, photo_height)), (x, image_y))

    footer_y = PAGE_HEIGHT - MARGIN - 70
    draw.line((left_x1, footer_y, right_x2, footer_y), fill=LINE, width=2)
    draw.text((left_x1, footer_y + 18), f"Angebotsunterlagen | Seite {page_number}", font=small_font, fill=MUTED)
    return page


def default_title(rooms: list[Room], document_type: str) -> str:
    if document_type == "angebot":
        names = [room.name for room in rooms]
        if names == ["Bad", "Gästebad", "Flur"]:
            return "Unterlagen zur Angebotserstellung Bad, Gästebad und Flur"
        if len(names) == 1:
            return f"Unterlagen zur Angebotserstellung {names[0]}"
        if len(names) == 2:
            return f"Unterlagen zur Angebotserstellung {names[0]} und {names[1]}"
        return f"Unterlagen zur Angebotserstellung {', '.join(names[:-1])} und {names[-1]}"
    return "Sauerbruch 3 | Handwerkerbriefing"


def today_label() -> str:
    return date.today().strftime("%d.%m.%Y")


def pdf_y(y_from_top: float) -> float:
    return PAGE_HEIGHT - y_from_top


def draw_pdf_card(pdf: canvas.Canvas, x: float, y_top: float, width: float, height: float, radius: float = 26, fill: str = CARD, stroke: str = LINE) -> None:
    pdf.setFillColor(HexColor(fill))
    pdf.setStrokeColor(HexColor(stroke))
    pdf.roundRect(x, pdf_y(y_top + height), width, height, radius, fill=1, stroke=1)


def draw_pdf_text(pdf: canvas.Canvas, text: str, x: float, y_top: float, size: float, color: str = TEXT, font: str = "Helvetica") -> None:
    pdf.setFont(font, size)
    pdf.setFillColor(HexColor(color))
    pdf.drawString(x, pdf_y(y_top) - size, text)


def draw_pdf_link(pdf: canvas.Canvas, text: str, x: float, y_top: float, size: float, url: str, color: str = "#6f7f8f", font: str = "Helvetica") -> None:
    draw_pdf_text(pdf, text, x, y_top, size, color=color, font=font)
    text_width = stringWidth(text, font, size)
    y_bottom = pdf_y(y_top)
    y_top_pdf = y_bottom - size - 2
    pdf.linkURL(url, (x, y_top_pdf, x + text_width, y_bottom), relative=0)


def wrap_pdf_text(text: str, font: str, size: float, width: float) -> list[str]:
    words = text.split()
    if not words:
        return [""]
    lines: list[str] = []
    current = words[0]
    for word in words[1:]:
        candidate = f"{current} {word}"
        if stringWidth(candidate, font, size) <= width:
            current = candidate
        else:
            lines.append(current)
            current = word
    lines.append(current)
    return lines


def draw_pdf_wrapped_lines(
    pdf: canvas.Canvas,
    lines: list[str],
    x: float,
    y_top: float,
    width: float,
    size: float,
    color: str = TEXT,
    font: str = "Helvetica",
    leading: float = 1.25,
    bullet: bool = False,
) -> float:
    cursor = y_top
    line_height = size * leading
    pdf.setFillColor(HexColor(color))
    pdf.setFont(font, size)
    for line in lines:
        wrapped = wrap_pdf_text(line, font, size, width - (18 if bullet else 0))
        for index, part in enumerate(wrapped):
            if bullet and index == 0:
                pdf.drawString(x, pdf_y(cursor) - size, u"\u2022")
                pdf.drawString(x + 18, pdf_y(cursor) - size, part)
            else:
                offset = 18 if bullet else 0
                pdf.drawString(x + offset, pdf_y(cursor) - size, part)
            cursor += line_height
        cursor += size * 0.35
    return cursor


def draw_pdf_image(pdf: canvas.Canvas, path: Path, x: float, y_top: float, width: float, height: float) -> None:
    with Image.open(path) as raw:
        image = ImageOps.exif_transpose(raw).convert("RGB")
        img_width, img_height = image.size
        target_ratio = width / height
        source_ratio = img_width / img_height
        if source_ratio > target_ratio:
            crop_width = int(img_height * target_ratio)
            offset = (img_width - crop_width) // 2
            image = image.crop((offset, 0, offset + crop_width, img_height))
        else:
            crop_height = int(img_width / target_ratio)
            offset = (img_height - crop_height) // 2
            image = image.crop((0, offset, img_width, offset + crop_height))
        # Downscale and JPEG-compress images before embedding to keep the PDF practical.
        image = image.resize((max(1, int(width)), max(1, int(height))), Image.Resampling.LANCZOS)
        buffer = io.BytesIO()
        image.save(buffer, format="JPEG", quality=82, optimize=True)
        buffer.seek(0)
        pdf.drawImage(ImageReader(buffer), x, pdf_y(y_top + height), width=width, height=height, preserveAspectRatio=False, mask="auto")


def build_offer_pdf(
    output_path: Path,
    title: str,
    selected_rooms: list[Room],
    room_payloads: list[dict],
) -> None:
    pdf = canvas.Canvas(str(output_path), pagesize=(PAGE_WIDTH, PAGE_HEIGHT))
    pdf.setTitle(title)
    pdf.setAuthor("Codex")
    pdf.setSubject("Angebotsunterlagen")

    date_text = f"Stand: {today_label()}"

    draw_pdf_card(pdf, MARGIN + 90, MARGIN + 120, PAGE_WIDTH - 2 * MARGIN - 180, 130, radius=28, fill="#ffffff", stroke="#ffffff")
    draw_pdf_text(pdf, f"Unterlagen zur Angebotserstellung | Version {VERSION}", MARGIN + 120, MARGIN + 165, 28, color="#7d6952")
    draw_pdf_text(pdf, date_text, PAGE_WIDTH - MARGIN - 260, MARGIN + 168, 24, color=MUTED)
    draw_pdf_link(pdf, PROJECT_URL, MARGIN + 120, MARGIN + 202, 22, PROJECT_URL)
    title_lines = wrap_pdf_text(title, "Helvetica", 88, PAGE_WIDTH - 2 * MARGIN - 180)
    title_y = MARGIN + 340
    for line in title_lines:
        draw_pdf_text(pdf, line, MARGIN + 90, title_y, 88)
        title_y += 102
    pdf.setStrokeColor(HexColor(LINE))
    pdf.line(MARGIN + 90, pdf_y(title_y + 40), PAGE_WIDTH - MARGIN - 90, pdf_y(title_y + 40))
    draw_pdf_text(pdf, "Enthaltene Räume", MARGIN + 90, title_y + 120, 40)
    draw_pdf_wrapped_lines(pdf, [room.name for room in selected_rooms], MARGIN + 90, title_y + 210, 520, 40, bullet=True)

    note_box_x = MARGIN + 790
    note_box_y = title_y + 105
    note_box_w = PAGE_WIDTH - MARGIN - 90 - note_box_x
    note_box_h = 495
    draw_pdf_card(pdf, note_box_x, note_box_y, note_box_w, note_box_h, radius=26, fill="#ffffff", stroke="#e9e3d8")
    draw_pdf_text(pdf, "Hinweis", note_box_x + 30, note_box_y + 28, 40)
    note_lines = [
        "Grundlage für die Angebotserstellung.",
        "Fokus auf Maße, Bestand, Planunterlagen und gewünschte Leistungen.",
        "Platzhalterbilder und nicht belastbare Zusatzannahmen wurden ausgeschlossen.",
    ]
    draw_pdf_wrapped_lines(pdf, note_lines, note_box_x + 30, note_box_y + 110, note_box_w - 60, 26, color=MUTED, bullet=True)

    footer_y = PAGE_HEIGHT - MARGIN - 350
    draw_pdf_card(pdf, MARGIN + 90, footer_y, PAGE_WIDTH - 2 * MARGIN - 180, 180, radius=26, fill="#ffffff", stroke="#e9e3d8")
    draw_pdf_text(pdf, "Verwendungszweck", MARGIN + 120, footer_y + 32, 40)
    footer_lines = [
        "Projektinformationen für die Angebotseinholung.",
        "Je Raum: Maße, Bestand, Pläne und gewünschte Leistungen.",
    ]
    draw_pdf_wrapped_lines(pdf, footer_lines, MARGIN + 120, footer_y + 94, PAGE_WIDTH - 2 * MARGIN - 240, 26, color=MUTED)
    draw_pdf_text(pdf, "Sauerbruch 3", MARGIN + 90, PAGE_HEIGHT - MARGIN - 70, 26, color=MUTED)
    pdf.showPage()

    for page_number, payload in enumerate(room_payloads, start=2):
        room = payload["room"]
        tasks = payload["tasks"]
        plan_images = payload["plan_images"]
        bestand_images = payload["bestand_images"]
        materials = payload["materials"]

        draw_pdf_text(pdf, title, MARGIN + 70, MARGIN + 62, 26, color=MUTED)
        draw_pdf_text(pdf, room.status, PAGE_WIDTH - MARGIN - 160, MARGIN + 62, 26, color=ACCENT)
        draw_pdf_text(pdf, date_text, PAGE_WIDTH - MARGIN - 260, MARGIN + 100, 22, color=MUTED)
        draw_pdf_link(pdf, PROJECT_URL, MARGIN + 70, MARGIN + 100, 20, PROJECT_URL)
        draw_pdf_text(pdf, room.name, MARGIN + 70, MARGIN + 140, 74)
        draw_pdf_text(pdf, f"Fläche: {format_area(room.area)} m²", MARGIN + 72, MARGIN + 246, 30)
        if room.area_derivation:
            draw_pdf_text(pdf, f"Herleitung: {room.area_derivation}", MARGIN + 72, MARGIN + 298, 30, color=MUTED)

        content_top = MARGIN + 370
        left_x1 = MARGIN + 70
        left_x2 = MARGIN + 610
        right_x1 = left_x2 + GAP
        right_x2 = PAGE_WIDTH - MARGIN - 70

        draw_pdf_card(pdf, left_x1, content_top, left_x2 - left_x1, 520)
        draw_pdf_text(pdf, "Geplanter Leistungsumfang", left_x1 + 28, content_top + 24, 30)
        draw_pdf_wrapped_lines(pdf, tasks, left_x1 + 34, content_top + 88, left_x2 - left_x1 - 60, 26, bullet=True)

        if materials:
            material_top = content_top + 520 + GAP
            draw_pdf_card(pdf, left_x1, material_top, left_x2 - left_x1, 410)
            draw_pdf_text(pdf, "Material- / Produktreferenzen", left_x1 + 28, material_top + 24, 30)
            material_lines = [f"{item.label}: {item.details}" if item.details else item.label for item in materials]
            draw_pdf_wrapped_lines(pdf, material_lines, left_x1 + 34, material_top + 82, left_x2 - left_x1 - 60, 23, bullet=True)

        draw_pdf_card(pdf, right_x1, content_top, right_x2 - right_x1, 305)
        draw_pdf_text(pdf, "Grundriss / Planausschnitt", right_x1 + 28, content_top + 24, 30)
        if plan_images:
            image_y = content_top + 84
            usable_width = right_x2 - right_x1 - 56
            plan_width = (usable_width - GAP) / max(len(plan_images[:2]), 1)
            for idx, path in enumerate(plan_images[:2]):
                x = right_x1 + 28 + idx * (plan_width + GAP)
                draw_pdf_image(pdf, path, x, image_y, plan_width, 185)

        if bestand_images:
            bestand_top = content_top + 305 + GAP
            draw_pdf_card(pdf, right_x1, bestand_top, right_x2 - right_x1, 640)
            draw_pdf_text(pdf, "Bestandsfotos", right_x1 + 28, bestand_top + 24, 30)
            cols = 1 if len(bestand_images) == 1 else 2
            photo_height = 220
            usable_width = right_x2 - right_x1 - 56
            tile_width = (usable_width - GAP * (cols - 1)) / cols
            start_y = bestand_top + 84
            for idx, path in enumerate(bestand_images[:4]):
                row = idx // cols
                col = idx % cols
                x = right_x1 + 28 + col * (tile_width + GAP)
                y_top = start_y + row * (photo_height + GAP)
                draw_pdf_image(pdf, path, x, y_top, tile_width, photo_height)

        pdf.setStrokeColor(HexColor(LINE))
        pdf.line(left_x1, pdf_y(PAGE_HEIGHT - MARGIN - 70), right_x2, pdf_y(PAGE_HEIGHT - MARGIN - 70))
        draw_pdf_text(pdf, f"Unterlagen zur Angebotserstellung | Seite {page_number}", left_x1, PAGE_HEIGHT - MARGIN - 52, 23, color=MUTED)
        pdf.showPage()

    pdf.save()


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
    offer_payloads: list[dict] = []

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
            offer_payloads.append(
                {
                    "room": room,
                    "tasks": tasks,
                    "plan_images": plan_images,
                    "bestand_images": bestand_images,
                    "materials": materials,
                }
            )
        else:
            tasks = extract_offer_work_items(planung)
            page = render_briefing_page(title, args.subtitle, room, before_path, after_path, tasks, page_number=index)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    if args.document_type == "angebot":
        build_offer_pdf(output_path, title, selected_rooms, offer_payloads)
    else:
        first, rest = pages[0], pages[1:]
        first.save(output_path, "PDF", resolution=150.0, save_all=True, append_images=rest)
    print(f"Created PDF: {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
