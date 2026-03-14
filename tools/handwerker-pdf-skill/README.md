# Handwerker-PDF Generator

Dieses Verzeichnis enthält den PDF-Generator für handwerkergeeignete Angebotsunterlagen auf Basis der Sauerbruch-Projektdaten.

## Zweck

Das Script erzeugt aus den vorhandenen Raum- und Mediendaten ein kompaktes PDF für Handwerker bzw. für die Angebotseinholung.

Das PDF enthält pro Raum:

- Raumtitel
- Fläche und Maß-Herleitung
- aktuellen Status
- `Geplanter Leistungsumfang`
- Grundriss / Planausschnitt
- Bestandsfotos
- Inspirationsbilder

Nicht enthalten:

- `Eigenleistung` im Leistungsumfang
- konkrete Preise
- Material- / Produktreferenzen

## Wichtige Eigenschaften

- Das PDF ist textbasiert:
  Text ist auswählbar, kopierbar und durchsuchbar.
- Der Link zur GitHub-Page ist im Header als klickbarer Link enthalten:
  `https://del4gent.github.io/sauerbruch/`
- Bilder mit `_placeholder` im Dateinamen werden ignoriert.

## Script

Pfad:

`tools/handwerker-pdf-skill/scripts/build_handwerker_pdf.py`

## Datenquellen

Der Generator liest seine Daten direkt aus dem Repository:

- `apps/hausplanung/public/assets/data/rooms.json`
- `apps/hausplanung/public/assets/data/images.json`
- `apps/hausplanung/public/assets/rooms/<raum>/planung.json`

## Wie der Generator arbeitet

### 1. Räume auswählen

Die gewünschten Räume werden über `--rooms` übergeben, zum Beispiel:

`bad,wc,flur`

Die Reihenfolge in `--rooms` ist auch die Reihenfolge im PDF.

### 2. Leistungsumfang bestimmen

Der Block `Geplanter Leistungsumfang` wird aus dem Ablaufplan des jeweiligen Raums erzeugt.

Dabei gilt:

- abgeschlossene Schritte werden ignoriert
- Einträge mit `Ausführung = Eigenleistung` werden ignoriert
- nur verbleibende Handwerkerleistungen landen im PDF

### 3. Bilder auswählen

Der Generator nutzt:

- Pläne aus `medien/plan/`
- Bestandsfotos aus `medien/ist/`
- Inspirationsbilder aus `medien/inspiration/`

Fehlende Bilder werden still übersprungen.

## Ausführen

### Standardbeispiel

```bash
python3 tools/handwerker-pdf-skill/scripts/build_handwerker_pdf.py \
  --project-root /Users/dobby/sauerbruch \
  --output /Users/dobby/sauerbruch/out/unterlagen-zur-angebotserstellung-bad-gaestebad-und-flur.pdf \
  --document-type angebot \
  --rooms bad,wc,flur
```

### Wichtige Optionen

- `--project-root`
  Repository-Wurzel, normalerweise `/Users/dobby/sauerbruch`
- `--output`
  Zielpfad der PDF-Datei
- `--document-type angebot`
  aktiviert das Angebots-/Handwerkerformat
- `--rooms`
  kommaseparierte Liste der Räume
- `--title`
  optionaler eigener Titel
- `--include-finished`
  nimmt auch fertig markierte Räume auf
- `--debug-image-selection`
  gibt gewählte Bildpfade in der Konsole aus

## Typischer Output

Für den aktuellen Standardfall liegt die finale Datei typischerweise hier:

`out/unterlagen-zur-angebotserstellung-bad-gaestebad-und-flur.pdf`

## Hinweise zur Pflege

Wenn sich die JSON-Struktur ändert, sind vor allem diese Teile des Scripts relevant:

- Raumauswahl
- Leistungsumfang-Filter
- Bildauswahl für Plan / Bestand / Inspiration
- PDF-Layout im Angebotsmodus

Wenn neue Regeln dazukommen, sollte die Doku hier mit aktualisiert werden.
