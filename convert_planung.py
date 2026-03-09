import os
import json
import re

def parse_markdown(content):
    data = {
        "title": "",
        "basisdaten": {
            "flaeche": "",
            "herleitung": "",
            "status": ""
        },
        "sections": []
    }
    
    # Parse Title
    title_match = re.search(r'^# Planung:\s*(.*)', content, re.MULTILINE)
    if title_match:
        data["title"] = title_match.group(1).strip()
    
    # Split into sections by ##
    sections = re.split(r'^##\s*', content, flags=re.MULTILINE)
    
    for section in sections:
        section = section.strip()
        if not section:
            continue
        
        lines = section.split('\n')
        section_header = lines[0].strip()
        section_body = '\n'.join(lines[1:]).strip()
        
        # Clean section header from emojis
        clean_header = re.sub(r'[^\w\s\(\)-]', '', section_header).strip()
        
        if "BASISDATEN" in clean_header:
            flaeche_match = re.search(r'Fläche:\s*(.*?)(?:\s*\(Derivation:\s*(.*?)\))?$', section_body, re.MULTILINE)
            if flaeche_match:
                data["basisdaten"]["flaeche"] = flaeche_match.group(1).strip()
                if flaeche_match.group(2):
                    data["basisdaten"]["herleitung"] = flaeche_match.group(2).strip()
            
            status_match = re.search(r'Status:\s*(.*)', section_body, re.MULTILINE)
            if status_match:
                data["basisdaten"]["status"] = status_match.group(1).strip()
        else:
            # Detect type: checklist or table
            # A section can have both text and a checklist/table.
            # We look for the checklist/table anywhere in the body.
            
            # Checklist check
            checklist_items = []
            for line in lines[1:]:
                item_match = re.search(r'-\s*\[([ xX])\]\s*(.*)', line)
                if item_match:
                    checklist_items.append({
                        "label": item_match.group(2).strip(),
                        "done": item_match.group(1).lower() == 'x'
                    })
            
            # Table check
            table_lines = []
            in_table = False
            for line in lines[1:]:
                if '|' in line:
                    if not in_table:
                        # Check if this is a header or separator
                        if '-' in line and re.match(r'^[\s|:-]+$', line.strip()):
                            # Separator found, but we need the line before it as header
                            if table_lines:
                                in_table = True
                        table_lines.append(line.strip())
                    else:
                        table_lines.append(line.strip())
                elif in_table:
                    break
            
            if table_lines and any('-' in l and re.match(r'^[\s|:-]+$', l.strip()) for l in table_lines):
                # We found a table
                # Find the separator index
                sep_idx = -1
                for i, l in enumerate(table_lines):
                    if '-' in l and re.match(r'^[\s|:-]+$', l.strip()):
                        sep_idx = i
                        break
                
                if sep_idx > 0:
                    header_line = table_lines[sep_idx-1]
                    headers = [h.strip() for h in header_line.split('|') if h.strip()]
                    
                    rows = []
                    for row_line in table_lines[sep_idx+1:]:
                        temp_row = [cell.strip() for cell in row_line.split('|')]
                        if row_line.strip().startswith('|'):
                            temp_row = temp_row[1:]
                        if row_line.strip().endswith('|'):
                            temp_row = temp_row[:-1]
                        rows.append(temp_row)
                    
                    data["sections"].append({
                        "title": clean_header,
                        "type": "table",
                        "headers": headers,
                        "rows": rows
                    })
            elif checklist_items:
                data["sections"].append({
                    "title": clean_header,
                    "type": "checklist",
                    "items": checklist_items
                })

    return data

def process_all_rooms(root_dir):
    rooms_dir = os.path.join(root_dir, 'apps/hausplanung/public/assets/rooms')
    rooms_json_path = os.path.join(root_dir, 'apps/hausplanung/public/assets/data/rooms.json')
    
    for room_id in os.listdir(rooms_dir):
        room_path = os.path.join(rooms_dir, room_id)
        if os.path.isdir(room_path):
            md_path = os.path.join(room_path, 'planung.md')
            if os.path.exists(md_path):
                with open(md_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                json_data = parse_markdown(content)
                
                json_path = os.path.join(room_path, 'planung.json')
                with open(json_path, 'w', encoding='utf-8') as f:
                    json.dump(json_data, f, indent=2, ensure_ascii=False)
                
                os.remove(md_path)
                print(f"Converted {md_path} to {json_path}")

    # Update rooms.json
    if os.path.exists(rooms_json_path):
        with open(rooms_json_path, 'r', encoding='utf-8') as f:
            rooms_data = json.load(f)
        
        for room in rooms_data:
            if room['path'].endswith('planung.md'):
                room['path'] = room['path'].replace('planung.md', 'planung.json')
        
        with open(rooms_json_path, 'w', encoding='utf-8') as f:
            json.dump(rooms_data, f, indent=2, ensure_ascii=False)
        print(f"Updated {rooms_json_path}")

if __name__ == "__main__":
    process_all_rooms('/Users/dobby/sauerbruch')
