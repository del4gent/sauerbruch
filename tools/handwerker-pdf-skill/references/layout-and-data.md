# Layout And Data

## Intent

This skill produces contractor-facing PDFs from the Sauerbruch planning repository. The document should feel factual, restrained, and easy to scan on paper or on a tablet.

## Page Structure

Each room page should contain:

1. Project title and room name
2. Area line with derivation when available
3. Two image panels:
   - `Vorher`
   - `Nachher`
4. A short bullet list under `Was zu tun ist`

## Data Sources

- `apps/hausplanung/public/assets/data/rooms.json`
  - room name
  - area
  - area derivation
  - path to `planung.json`
- `apps/hausplanung/public/assets/data/images.json`
  - room media inventory
- `apps/hausplanung/public/assets/rooms/<room>/planung.json`
  - sections
  - task tables
  - checklists

## Task Extraction

Preferred source order:

1. `ABLAUFPLAN` or `RENOVIERUNGS-ABLAUF` tables
2. Checklists with unfinished items
3. Any checklist if no status is available

Ignore completed items when a status column clearly indicates completion.

## Image Selection

Preferred source order:

1. `Vorher`: first `/ist/` image
2. `Nachher`: first `/inspiration/` image
3. Fallback `Nachher`: first `/plan/` image

If a room has no image for a slot, render a neutral placeholder block with the label instead of dropping the section.
