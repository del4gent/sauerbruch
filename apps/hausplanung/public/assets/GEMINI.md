# Projekt-Regeln: Hausplanung

## 📏 Berechnungs-Prinzip
**Jede berechnete Zahl muss zwingend eine Herleitung enthalten.**
- **Flächen:** Jede m²-Angabe muss die Formel (z.B. Länge x Breite) oder die Quelle (z.B. "laut Grundriss") in Klammern direkt dahinter stehen haben.
- **Kosten:** Summenbildungen müssen transparent sein (z.B. "Material x Menge"). Es dürfen **NUR Materialkosten** aufgeführt werden, keine Arbeitskosten oder Montageleistungen.
- **Konsistenz:** Dieses Format muss sowohl in den Markdown-Dateien als auch im generierten PDF beibehalten werden.

## 📁 Struktur-Regeln
- Räume werden immer in `rooms/[raumname]/planung.json` gepflegt.
- Bilder liegen immer in den Unterordnern `ist`, `inspiration`, `plan` und `material` innerhalb des jeweiligen Raum-Ordners.
- Der PDF-Generator (`generator.py`) muss diese Herleitungen unterstützen und im PDF anzeigen.
