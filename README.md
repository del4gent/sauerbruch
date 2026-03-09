# 🏠 Projekt Sauerbruch 3 - Hausplanung & Renovierung

Dieses Repository ist das zentrale Tool zur Planung, Dokumentation und Kostenüberwachung der Renovierungsmaßnahmen in der Sauerbruchstraße 3. Es kombiniert eine **Angular-Web-App** zur Visualisierung mit einem **Markdown-basierten Daten-Workflow** und automatisierter **PDF-Generierung**.

🚀 **Live-Planer:** [https://del4gent.github.io/sauerbruch/](https://del4gent.github.io/sauerbruch/)

---

## 🏗 Projektstruktur & Komponenten

Das Projekt ist als **Nx Monorepo** organisiert:

*   **`apps/hausplanung`**: Die Angular-App (v21). Sie dient als interaktives Dashboard für Flächen, Budgets und den Fortschritt.
*   **`apps/hausplanung/public/assets`**: Das "Gehirn" des Projekts. Hier liegen alle Daten:
    *   **`rooms/`**: Pro Raum ein Ordner mit einer `planung.md` und Medien (`ist/`, `inspiration/`, `plan/`, `material/`).
    *   **`pdf_builder/`**: Modularer Python-Kern zur Verarbeitung der Markdown-Daten.
    *   **`generator.py`**: Das Hauptskript zur Erstellung des `renovierungsplan.pdf`.
*   **`dist/`**: Enthält die gebaute Angular-App für das Deployment.

---

## 📏 Das Berechnungs-Prinzip (Mandatorisch)

Um maximale Transparenz gegenüber Fachbetrieben und für die eigene Budgetkontrolle zu gewährleisten, gilt eine strikte Regel für **alle** Zahlenwerte (festgelegt in `GEMINI.md`):

> **Jede berechnete Zahl muss zwingend eine Herleitung enthalten.**

*   **Flächen:** `Fläche: 15 m² (Derivation: 3.75m x 4.00m)` oder `(Quelle: laut Grundriss)`.
*   **Kosten:** `Summe: 1.200 € (Material: 800€ + Zubehör: 400€)`.
*   **Hinweis:** Es werden **nur Materialkosten** aufgeführt. Montageleistungen sind separat zu betrachten.

---

## 🛠 Workflow: Daten aktualisieren & PDF generieren

Wenn Sie Daten an einem Raum ändern (z. B. im Bad neue Fliesen planen):

1.  Bearbeiten Sie die entsprechende `apps/hausplanung/public/assets/rooms/[raum]/planung.md`.
2.  Stellen Sie sicher, dass Bilder im korrekten Unterordner (z. B. `medien/material/`) liegen.
3.  Führen Sie den Generator aus, um das PDF und die `PROJEKT_DETAILS.md` zu aktualisieren:
    ```bash
    python3 apps/hausplanung/public/assets/generator.py
    ```
4.  Die Angular-App liest diese Daten zur Laufzeit ein (via `data/rooms.json`) und aktualisiert das Dashboard.

---

## 💻 Entwicklung (Angular & Nx)

### Lokale Entwicklung
```bash
npx nx serve hausplanung
```

### Build & Deployment
Das Projekt wird automatisch via GitHub Actions auf GitHub Pages bereitgestellt, sobald Änderungen in den `main` Branch gepusht werden.

---

## 📂 Datei-Konventionen (für den Parser)

Damit der Python-Parser die Daten korrekt extrahiert, müssen in den `planung.md` Dateien bestimmte Sektionen vorhanden sein:
- `## Basisdaten`: Enthält Fläche und Status.
- `## Material & Kosten`: Eine Tabelle oder Liste der geplanten Materialien mit Preisen.
- `## Aufgaben`: Checkliste für den Fortschritt.

---
*Dieses System ermöglicht eine lückenlose Dokumentation vom ersten Aufmaß bis zur finalen Abnahme.*
