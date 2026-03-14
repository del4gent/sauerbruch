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

def parse_room_json(room, json_path):
    if not os.path.exists(json_path): return room
    
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    # Update room metadata if available in basisdaten
    if 'basisdaten' in data:
        bd = data['basisdaten']
        if 'flaeche' in bd:
            try:
                area_str = bd['flaeche'].replace(' m2', '').replace(' m²', '').replace(',', '.')
                room.area = float(re.search(r'(\d+(?:\.\d+)?)', area_str).group(1))
            except: pass
        if 'herleitung' in bd: room.area_derivation = bd['herleitung']
        if 'status' in bd: room.status = bd['status']

    for section_data in data.get('sections', []):
        title = section_data.get('title', '').upper()
        sec_type = section_data.get('type', 'text')
        items = section_data.get('items', [])
        
        section_key = title.lower()
        if 'material' in section_key or 'kosten' in section_key:
            continue

        section = Section(title=title, key=section_key, items=[], is_table=(sec_type == 'table'))
        
        if sec_type == 'table':
            table_items = items # it's the TableData object or list
            if isinstance(table_items, dict):
                headers = table_items.get('headers', [])
                rows = table_items.get('rows', [])
                if headers: section.items.append(headers)
                for row in rows:
                    section.items.append(row)
            elif isinstance(table_items, list):
                section.items = table_items # Fallback for old list-of-lists format
        elif sec_type == 'checklist':
            for item in items:
                prefix = '[x] ' if item.get('done') else '[ ] '
                section.items.append(f"{prefix}{item.get('label', '')}")
        else:
            section.items = [str(items)]
            
        room.sections.append(section)
                
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
            parse_room_json(room, room_path)
        rooms.append(room)
        
    return rooms
