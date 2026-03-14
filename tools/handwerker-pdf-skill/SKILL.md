---
name: handwerker-pdf
description: Use when the user wants a clean, contractor-facing PDF generated from room planning data, especially from `apps/hausplanung/public/assets`. Best for one-page-per-room overviews with square meters, before/after images, and a concise list of work items.
---

# Handwerker PDF

Create a minimalist PDF for tradespeople from the Sauerbruch planning data. The default output is one page per room with room name, square meters, one "Vorher" image, one "Nachher" image, and a short "Was zu tun ist" list derived from each room's `planung.json`.

## When To Use

- The user wants a printable or shareable PDF for a contractor.
- The source data lives in `apps/hausplanung/public/assets/data/*.json` and `apps/hausplanung/public/assets/rooms/*/planung.json`.
- The desired output should be visually quiet, clear, and practical instead of decorative.
- The user asks for room-by-room scopes like "Bad, WC, Flur" with photos and tasks.

## Default Workflow

1. Read `apps/hausplanung/public/assets/data/rooms.json` to discover room ids, names, area, and `planung.json` paths.
2. Read `apps/hausplanung/public/assets/data/images.json` to find candidate images.
3. For each target room, read its `planung.json`.
4. Prefer images like this:
   - `Vorher`: first image from `/ist/`
   - `Nachher`: first image from `/inspiration/`
   - fallback for `Nachher`: first image from `/plan/`
5. Build the work list from unfinished steps in `ABLAUFPLAN` or similar sections.
6. Run `scripts/build_handwerker_pdf.py`.
7. Verify the PDF visually. If the wording or room selection should change, rerun with different options instead of rewriting the PDF by hand.

## Script

Use `scripts/build_handwerker_pdf.py` for the actual PDF generation.

Typical command:

```bash
python3 tools/handwerker-pdf-skill/scripts/build_handwerker_pdf.py \
  --project-root /Users/dobby/sauerbruch \
  --output /Users/dobby/sauerbruch/out/handwerker-bad-wc.pdf \
  --rooms bad,wc
```

Useful options:

- `--rooms bad,wc,flur` limits the export to specific rooms.
- `--title "Sauerbruch 3 | Handwerkerbriefing"` overrides the PDF title.
- `--subtitle "Stand: März 2026"` adds a small project note.
- `--include-finished` also exports rooms already marked as finished.
- `--document-type angebot` creates compact offer documents with plan images, bestandsfotos, and material references.
- `--debug-image-selection` prints the selected `Vorher` / `Nachher` files for validation.

## Output Rules

- Keep the design calm and sparse.
- Use one page per room.
- Show area with derivation when available.
- Prefer short action bullets such as `Fußbodenheizung verlegen` or `Fliesen legen`.
- Exclude tasks already marked `Fertig`, `Erledigt`, or `✅ fertig`.
- If a room has no inspiration image, use a plan image as the `Nachher` placeholder.
- If a room has no usable tasks, add one fallback bullet: `Leistungsumfang manuell abstimmen`.

## If The User Wants Changes

- For different wording, edit the script labels first, not the raw project data.
- For a different visual system, read `references/layout-and-data.md`.
- If the user wants extra sections like budget or material choices, extend the script carefully so the one-page layout stays readable.
