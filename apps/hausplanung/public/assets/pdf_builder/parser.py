import os
import re
import json
from .models import Room, Section
from .config import RAEUME_DIR, ROOMS_JSON_PATH

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

def parse_room_markdown(room, md_path):
    if not os.path.exists(md_path): return room
    
    with open(md_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        room.content = "".join(lines)
        
    current_section = None
    for line in lines:
        line = line.strip()
        if not line: continue
        
        # Sections
        if line.startswith('##') or line.startswith('###'):
            title = re.sub(r'[^\w\s\(\)&\-/,]', '', line.lstrip('# ').strip()).upper()
            current_section = Section(title=title, key=line.lower(), items=[], is_table=False)
            room.sections.append(current_section)
            continue
            
        if current_section:
            if '|' in line:
                # Skip markdown separator lines
                if re.match(r'^\|?\s?[:\-|\s]+\s?\|?$', line) or line.startswith('| :---'):
                    continue
                
                current_section.is_table = True
                cols = [p.strip() for p in line.split('|') if p.strip()]
                
                # Filter out header lines
                if not cols or cols[0].lower() == 'posten':
                    continue

                if len(cols) >= 5:
                    for idx in [1, 3, 4]: 
                        if idx < len(cols) and '(' in cols[idx]:
                            cols[idx] = cols[idx].split('(')[0].strip()
                    
                    try:
                        cost_str = cols[4].replace('.', '').replace(',', '.')
                        cost_match = re.search(r'(\d+(?:\.\d+)?)', cost_str)
                        if cost_match: room.total_cost += float(cost_match.group(1))
                    except: pass
                
                current_section.items.append(cols)
            else:
                item = re.sub(r'^[-*]\s*(?:\[[ xX]\]\s*)?|^\d+\.\s*', '', line).strip()
                if item: current_section.items.append(item)
                
    room.images = extract_images(room.path)
    return room

def get_all_rooms():
    rooms = []
    if not os.path.exists(ROOMS_JSON_PATH): 
        print(f"Warning: {ROOMS_JSON_PATH} not found.")
        return rooms
    
    with open(ROOMS_JSON_PATH, 'r', encoding='utf-8') as f:
        rooms_data = json.load(f)
        
    for data in rooms_data:
        room_path = os.path.join(os.path.dirname(ROOMS_JSON_PATH), '..', data['path'])
        room_dir = os.path.dirname(room_path)
        
        room = Room(
            name=data['name'].upper(),
            path=room_dir,
            area=data['area'],
            status=data['status']
        )
        room.area_derivation = data.get('area_derivation', '')
        
        if os.path.isfile(room_path):
            parse_room_markdown(room, room_path)
        rooms.append(room)
        
    return rooms
