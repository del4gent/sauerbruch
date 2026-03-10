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

## ⚠️ Legacy: PDF-Generator

Der ursprüngliche Python-basierte PDF-Generator (`generator.py`) und die Markdown-Parser sind als **veraltet (outdated)** markiert und werden nicht mehr aktiv gepflegt. Die Web-App ist die primäre Dokumentationsform.

---

## 💻 Entwicklung (Angular & Nx)

### Lokale Entwicklung
```bash
npx nx serve hausplanung
```

### Build & Deployment
Das Projekt wird automatisch via GitHub Actions auf GitHub Pages bereitgestellt, sobald Änderungen in den `main` Branch gepusht werden.

