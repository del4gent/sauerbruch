import os
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
    import re
    print(f"Aktualisiere Master-Dokument: {MASTER_MD_PATH}")
    with open(MASTER_MD_PATH, 'w', encoding='utf-8') as f:
        f.write("# 🏠 SAUERBRUCH 3 - GESAMTPLANUNG\n\n")
        f.write(f"**Gesamtfläche:** {sum(r.area for r in rooms):.2f} m²  \n")
        f.write(f"**Gesamtkosten:** {sum(r.total_cost for r in rooms):,.2f} EUR\n\n".replace(',', '.'))
        f.write("---\n\n")
        
        for room in rooms:
            f.write(f"## {room.name}\n\n")
            # Adjust image paths in content and remove the redundant title
            content = room.content
            # Remove the first H1 header (# Title) if it exists
            content = re.sub(r'^#\s+.*?\n+', '', content, flags=re.MULTILINE)
            
            # Find all markdown image links ![alt](path)
            # and prefix the path with the room's subdirectory
            room_rel_path = f"rooms/{os.path.basename(room.path)}"
            
            def prefix_path(match):
                alt_text = match.group(1)
                path = match.group(2)
                # Only prefix if it's a relative path and not already prefixed
                if not path.startswith(('http', '/', 'raeume/')):
                    # Clean up ./ if present
                    if path.startswith('./'):
                        path = path[2:]
                    return f"![{alt_text}]({room_rel_path}/{path})"
                return match.group(0)

            content = re.sub(r'!\[(.*?)\]\((.*?)\)', prefix_path, content)
            
            f.write(content)
            f.write("\n\n---\n\n")

if __name__ == "__main__":
    build_pdf()
