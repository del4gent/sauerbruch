import os
import json
from .parser import get_all_rooms
from .engine import ArchitectPDF
from .config import PDF_PATH, MASTER_MD_PATH

def build_pdf():
    print("Starte PDF-Generierung...")
    rooms = get_all_rooms()
    if not rooms:
        print("Keine Räume zum Verarbeiten gefunden.")
        return

    # Create PDF engine
    pdf = ArchitectPDF()
    
    # Render components
    pdf.render_cover()
    pdf.render_toc()
    
    total_area = sum(r.area for r in rooms)
    total_cost = sum(r.total_cost for r in rooms)
    pdf.render_summary(total_area, total_cost)
    
    for i, room in enumerate(rooms):
        print(f"Verarbeite Raum: {room.name}")
        pdf.render_room(i, room)
    
    # Finalize TOC (requires all pages to be rendered)
    pdf.finalize_toc()
    
    # Save PDF
    pdf.output(PDF_PATH)
    print(f"Erfolg: PDF wurde unter {PDF_PATH} gespeichert.")
    
    # Update Master Markdown
    update_master_markdown(rooms)

def update_master_markdown(rooms):
    print(f"Aktualisiere Master-Dokument: {MASTER_MD_PATH}")
    with open(MASTER_MD_PATH, 'w', encoding='utf-8') as f:
        f.write("# 🏠 SAUERBRUCH 3 - GESAMTPLANUNG\n\n")
        f.write(f"**Gesamtfläche:** {sum(r.area for r in rooms):.2f} m²  \n")
        f.write(f"**Gesamtkosten:** {sum(r.total_cost for r in rooms):,.2f} EUR\n\n".replace(',', '.'))
        f.write("---\n\n")
        
        for room in rooms:
            f.write(f"## {room.name}\n\n")
            f.write(f"- **Fläche:** {room.area:.2f} m² ({room.area_derivation})\n")
            f.write(f"- **Status:** {room.status}\n\n")
            
            for section in room.sections:
                f.write(f"### {section.title}\n\n")
                if section.is_table:
                    # Render Markdown Table
                    if section.items:
                        headers = section.items[0]
                        rows = section.items[1:]
                        f.write("| " + " | ".join(headers) + " |\n")
                        f.write("| " + " | ".join(["---"] * len(headers)) + " |\n")
                        for row in rows:
                            f.write("| " + " | ".join(str(cell) for cell in row) + " |\n")
                else:
                    for item in section.items:
                        f.write(f"- {item}\n")
                f.write("\n")
            
            f.write("\n---\n\n")

if __name__ == "__main__":
    build_pdf()
