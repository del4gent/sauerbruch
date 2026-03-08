import os
import re
from .models import Room, Section
from .config import RAEUME_DIR

def clean_text(text):
    if not text: return ""
    text = str(text).replace('**', '').replace('€', 'EUR').replace('\u20ac', 'EUR')
    text = text.replace('\u2022', '-').replace('•', '-').replace('\u2013', '-').replace('–', '-')
    text = text.replace('²', '2').replace('³', '3')
    return text.strip()

def extract_images(room_path):
    images = {'plan': [], 'ist': [], 'inspiration': [], 'material': []}
    extensions = ('.jpg', '.jpeg', '.png', '.heic')
    for category in images.keys():
        potential_paths = [
            os.path.join(room_path, category),
            os.path.join(room_path, 'medien', category)
        ]
        for p in potential_paths:
            if os.path.exists(p):
                imgs = [os.path.join(p, f) for f in os.listdir(p) if f.lower().endswith(extensions)]
                images[category].extend(imgs)
        images[category] = sorted(list(set(images[category])))
    return images

def parse_room_markdown(md_path):
    if not os.path.exists(md_path): return None
    
    room_path = os.path.dirname(md_path)
    room_name = os.path.basename(room_path).upper()
    
    room = Room(name=room_name, path=room_path)
    
    with open(md_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        room.content = "".join(lines)
        
    current_section = None
    for line in lines:
        line = line.strip()
        if not line: continue
        
        # Basisdaten
        area_match = re.search(r'(?:Fläche|Planwert|Gesamt):\s*(?:\*\*)?(\d+(?:[.,]\d+)?)\s*m[2²](?:\s*(.*))?', line, re.IGNORECASE)
        if area_match: 
            room.area = float(area_match.group(1).replace(',', '.'))
            if area_match.group(2):
                room.area_derivation = area_match.group(2).strip()
        
        status_match = re.search(r'Status:\s*(.+)', line, re.IGNORECASE)
        if status_match: room.status = status_match.group(1).replace('**', '').strip()
        
        # Sections
        if line.startswith('##') or line.startswith('###'):
            title = re.sub(r'[^\w\s\(\)&\-/,]', '', line.lstrip('# ').strip()).upper()
            current_section = Section(title=title, key=line.lower(), items=[], is_table=False)
            room.sections.append(current_section)
            continue
            
        if current_section:
            if '|' in line:
                # Skip markdown separator lines like |:---|
                if re.match(r'^\|?\s?[:\-|\s]+\s?\|?$', line) or line.startswith('| :---'):
                    continue
                
                current_section.is_table = True
                cols = [p.strip() for p in line.split('|') if p.strip()]
                
                # Filter out header lines if they appear in middle
                if not cols or cols[0].lower() == 'posten':
                    continue

                if len(cols) >= 5:
                    # Clean columns for numeric extraction and display
                    # Remove calculation notes in parentheses for Menge, Preis, Gesamt
                    for idx in [1, 3, 4]: 
                        if idx < len(cols) and '(' in cols[idx]:
                            cols[idx] = cols[idx].split('(')[0].strip()
                    
                    try:
                        # Extract numeric cost from last column
                        cost_str = cols[4].replace('.', '').replace(',', '.')
                        cost_match = re.search(r'(\d+(?:\.\d+)?)', cost_str)
                        if cost_match: room.total_cost += float(cost_match.group(1))
                    except: pass
                
                current_section.items.append(cols)
            else:
                # Clean list items or simple text
                item = re.sub(r'^[-*]\s*(?:\[[ xX]\]\s*)?|^\d+\.\s*', '', line).strip()
                if item: current_section.items.append(item)
                
    room.images = extract_images(room_path)
    return room

def get_all_rooms():
    rooms = []
    if not os.path.exists(RAEUME_DIR): return rooms
    
    for entry in sorted(os.listdir(RAEUME_DIR)):
        md_path = os.path.join(RAEUME_DIR, entry, 'planung.md')
        if os.path.isfile(md_path):
            room = parse_room_markdown(md_path)
            if room: rooms.append(room)
    return rooms
