# 🏠 SAUERBRUCH 3 | RENOVIERUNGS-PLANER

Dieses Repository ist die zentrale Plattform zur Planung, Dokumentation und Kostenüberwachung der Renovierungsmaßnahmen in der Sauerbruchstraße 3. Es handelt sich um eine **Angular-Web-App**, die als interaktives Dashboard für alle Räume dient.

🚀 **Live-Planer:** [https://del4gent.github.io/sauerbruch/](https://del4gent.github.io/sauerbruch/)

---

## 🏗 Projektstruktur & Komponenten

Das Projekt ist als **Nx Monorepo** organisiert:

*   **`apps/hausplanung`**: Die Angular-App (v21). Haupt-Interface für Flächen, Materialkosten und den Fortschritt.
*   **`apps/hausplanung/public/assets`**: Die Datenquelle (Source of Truth):
    *   **`data/`**: Zentrale JSON-Dateien (`rooms.json`, `materials.json`, `project.json`).
    *   **`rooms/`**: Pro Raum ein Ordner mit einer `planung.json` und Medien (`ist/`, `inspiration/`, `plan/`, `material/`).
*   **`dist/`**: Enthält die gebaute Angular-App für das Deployment.

---

## 📏 Das Berechnungs-Prinzip (Mandatorisch)

Um maximale Transparenz für die Budgetkontrolle zu gewährleisten, gilt eine strikte Regel für **alle** Zahlenwerte (festgelegt in `GEMINI.md`):

> **Jede berechnete Zahl muss zwingend eine Herleitung enthalten.**

*   **Flächen:** `Fläche: 15 m² (Derivation: 3.75m x 4.00m)` oder `(Quelle: laut Grundriss)`.
*   **Kosten:** `Summe: 1.200 € (Material: 800€ + Zubehör: 400€)`.
*   **Hinweis:** Es werden **nur Materialkosten** aufgeführt. Montageleistungen sind separat zu betrachten.

---

## 🛠 Workflow: Daten aktualisieren

Die Planung erfolgt direkt in den JSON-Dateien:

1.  Bearbeiten Sie die entsprechende `apps/hausplanung/public/assets/rooms/[raum]/planung.json`.
2.  Stellen Sie sicher, dass Bilder im korrekten Unterordner (z. B. `medien/material/`) liegen.
3.  Die Angular-App liest diese Daten zur Laufzeit ein und aktualisiert das Dashboard.

---

## 🔗 Personalisierter Freigabe-Link

Die Begrüßung im Start-Popover liest den Namen aus dem Query-Parameter `name`.

Format:

```text
https://del4gent.github.io/sauerbruch/?name=Vorname
```

Beispiel:

```text
https://del4gent.github.io/sauerbruch/?name=Max
```

Bei Namen mit Leerzeichen oder Sonderzeichen muss der Wert URL-kodiert sein.

Beispiel:

```text
https://del4gent.github.io/sauerbruch/?name=Anna%20Maria
```

Wichtig:
Der Willkommenshinweis wird pro Browser nur einmal angezeigt. Wenn er bereits geschlossen wurde, erscheint die persönliche Begrüßung trotz korrekt gesetztem `?name=` nicht erneut. In dem Fall entweder ein privates Fenster verwenden oder den Local-Storage-Eintrag `welcome-popover-seen` löschen.

---

## ⚠️ Legacy: PDF-Generator

Der ursprüngliche Python-basierte PDF-Generator (`generator.py`) und die Markdown-Parser sind als **veraltet (outdated)** markiert und werden nicht mehr aktiv gepflegt. Die Web-App ist die primäre Dokumentationsform.

---

## 📄 Angebots-PDF für Handwerker

Für Handwerker-Angebote liegt ein aktuelles, repo-versioniertes Skill- und Script-Setup unter:

- `tools/handwerker-pdf-skill/SKILL.md`
- `tools/handwerker-pdf-skill/scripts/build_handwerker_pdf.py`
- `tools/handwerker-pdf-skill/references/layout-and-data.md`
- `tools/handwerker-pdf-skill/agents/openai.yaml`

Wichtig:

- Das Script erzeugt ein **textbasiertes PDF**. Text ist also auswählbar, kopierbar und durchsuchbar.
- Für den **Leistungsumfang** werden nur Positionen ins PDF übernommen, die **nicht** als `Eigenleistung` markiert sind.
- Bilder mit `_placeholder` im Namen werden ignoriert.
- Das Script arbeitet direkt auf den JSON-Daten unter `apps/hausplanung/public/assets`.

### Standard-Aufruf

```bash
python3 tools/handwerker-pdf-skill/scripts/build_handwerker_pdf.py \
  --project-root /Users/dobby/sauerbruch \
  --output /Users/dobby/sauerbruch/out/angebotsunterlagen-bad-gaestebad-und-flur.pdf \
  --document-type angebot \
  --rooms bad,wc,flur
```

### Wichtige Optionen

- `--document-type angebot`
  Erstellt kompakte Angebotsunterlagen statt des allgemeinen Briefing-Formats.
- `--rooms bad,wc,flur`
  Beschränkt den Export auf bestimmte Räume und hält deren Reihenfolge ein.
- `--title "Angebotsunterlagen Bad, Gästebad und Flur"`
  Überschreibt den automatisch erzeugten Titel.
- `--include-finished`
  Nimmt auch bereits fertig markierte Räume auf.
- `--debug-image-selection`
  Gibt die gewählten Bildpfade für `Vorher` / `Nachher` in der Konsole aus.

### Datenbasis

Das Script nutzt vor allem:

- `apps/hausplanung/public/assets/data/rooms.json`
- `apps/hausplanung/public/assets/data/images.json`
- `apps/hausplanung/public/assets/data/materials.json`
- `apps/hausplanung/public/assets/rooms/<raum>/planung.json`

### Regeln für den Export

- Nur die per `--rooms` ausgewählten Räume werden gerendert.
- Für den Block `Geplanter Leistungsumfang` werden nur **Handwerkerleistungen** berücksichtigt.
- `Eigenleistung` wird in diesem Block bewusst ausgeschlossen.
- Bestandsfotos, Planausschnitte und Materialreferenzen bleiben erhalten, sofern echte Dateien vorhanden sind.

---

## 💻 Entwicklung (Angular & Nx)

### Lokale Entwicklung
```bash
npx nx serve hausplanung
```

### Build & Deployment
Das Projekt wird automatisch via GitHub Actions auf GitHub Pages bereitgestellt, sobald Änderungen in den `main` Branch gepusht werden.
