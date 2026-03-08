# Projekt Sauerbruch 3 - Hausplanung Renovierungs-Tool

Dieses Projekt dient der Planung und Kostenüberwachung einer Hausrenovierung. Es nutzt Markdown-Dateien für die Dateneingabe und Python für die Auswertung und PDF-Generierung.

## Projektstruktur
- `raeume/`: Enthält Unterordner für jeden Raum.
    - `[raum]/planung.md`: Die zentrale Planungsdatei für diesen Raum.
- `uebersicht.md`: Dashboard mit Links zu allen Räumen und Gesamtzusammenfassung.
- `generator.py`: Python-Skript zum Auslesen der Daten und Generieren der PDF.
- `medien/`: Ordner für Bilder, Pläne und das finale PDF.

## Markdown-Konventionen (WICHTIG für das Skript)
Damit der `generator.py` die Daten korrekt extrahieren kann, müssen folgende Formate eingehalten werden:

### 1. Fläche (Wichtig: Herleitungspflicht)
Muss unter `## Basisdaten` stehen und zwingend eine Herleitung oder Quelle in Klammern enthalten (gemäß `GEMINI.md`):
`- Fläche: 15 m² (Quelle: laut Grundriss)` oder `- Fläche: 2,56 m² (Derivation: 1,60 m x 1,60 m)`

## 🚀 PDF-Generierung
Um den aktuellen Renovierungsplan als PDF zu regenerieren, führen Sie folgenden Befehl im Hauptverzeichnis aus:

```bash
python3 generator.py
```

Das Skript:
1. Validiert und liest alle `planung.md` Dateien in `raeume/`.
2. Extrahiert Flächen, Kosten und Bilder.
3. Erzeugt die Datei `renovierungsplan.pdf`.
4. Aktualisiert automatisch das Master-Dokument `PROJEKT_DETAILS.md`.

**Wichtige Regel:** Führen Sie das Skript nach jeder Änderung an den Raum-Daten aus, um die Konsistenz zwischen Markdown-Dateien und PDF zu gewährleisten.
