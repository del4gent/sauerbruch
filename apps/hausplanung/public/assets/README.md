# 📊 Hausplanung - Daten & Assets

Dieser Ordner enthält alle Datenquellen und Medien für den Renovierungs-Planer.

## 📂 Struktur
- **`data/`**: Zentrale JSON-Konfigurationen (`rooms.json`, `materials.json`, `project.json`).
- **`rooms/`**: Detail-Planung pro Raum.
    - `[raum]/planung.json`: Strukturierte Daten für den Raum (Flächen, Kosten-Details, Ablauf).
    - `[raum]/medien/`: Bilder kategorisiert in `ist/`, `inspiration/`, `plan/` und `material/`.
- **`material/`**: Übergreifende Materialbilder.

## 📏 Herleitungspflicht (JSON-Format)
Gemäß `GEMINI.md` müssen alle Zahlenwerte in der `planung.json` Herleitungen enthalten.

Beispiel `planung.json`:
```json
{
  "basisdaten": {
    "flaeche": "6,64 m²",
    "herleitung": "2.01m x 3.305m"
  }
}
```

Beispiel Materialkosten:
```json
{
  "Posten": "Fliesen",
  "Gesamtpreis": "345,00 € (Herleitung: 15m² x 23€)"
}
```

## ⚠️ Veraltete Komponenten (Legacy)
Die folgenden Dateien und Ordner sind veraltet und werden durch die Angular-Web-App ersetzt:
- `generator.py` & `pdf_builder/`: (Veralteter PDF-Export)
- `PROJEKT_DETAILS.md`: (Veraltetes Master-Dokument)
