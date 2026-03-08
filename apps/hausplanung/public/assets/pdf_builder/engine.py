import os
import re
import subprocess
import tempfile
from fpdf import FPDF
from fpdf.enums import XPos, YPos
from .config import *
from .parser import clean_text
try:
    from PIL import Image, ImageOps
except ImportError:
    Image = None
    ImageOps = None

class ArchitectPDF(FPDF):
    def __init__(self):
        super().__init__(orientation='P', unit='mm', format='A4')
        self.toc_data = []
        self.temp_images = []
        self.set_margins(MARGIN_L, MARGIN_T, MARGIN_R)
        self.set_auto_page_break(True, MARGIN_B)

    def _resolve_image_path(self, room_path, rel_path):
        # If it's already an absolute path and exists, use it
        if os.path.isabs(rel_path) and os.path.exists(rel_path):
            target_path = rel_path
        else:
            # Normalize relative path
            rel_path = rel_path.lstrip('./')

            # Possible locations:
            # 1. Relative to the room directory
            # 2. Relative to the project root
            search_paths = [
                os.path.join(room_path, rel_path),
                os.path.join(BASE_DIR, rel_path),
                os.path.join(os.getcwd(), rel_path)
            ]

            target_path = None
            for p in search_paths:
                if os.path.exists(p):
                    target_path = p
                    break

        if not target_path:
            return None

        # Handle HEIC and potentially orientation
        processed_path = target_path
        
        # 1. Convert HEIC to JPG if necessary
        if target_path.lower().endswith('.heic'):
            try:
                temp_fd, temp_path = tempfile.mkstemp(suffix='.jpg')
                os.close(temp_fd)
                # Use sips (macOS native) to convert HEIC to JPG
                subprocess.run(['sips', '-s', 'format', 'jpeg', target_path, '--out', temp_path],
                               capture_output=True, check=True)
                self.temp_images.append(temp_path)
                processed_path = temp_path
            except Exception as e:
                print(f"Warning: Could not convert HEIC image {target_path}: {e}")
                return None

        # 2. Fix EXIF orientation if PIL is available
        if Image and ImageOps:
            try:
                with Image.open(processed_path) as img:
                    fixed_img = ImageOps.exif_transpose(img)
                    if fixed_img != img or processed_path != target_path:
                        if processed_path == target_path:
                            temp_fd, temp_path = tempfile.mkstemp(suffix='.jpg')
                            os.close(temp_fd)
                            self.temp_images.append(temp_path)
                            processed_path = temp_path
                        fixed_img.convert('RGB').save(processed_path, 'JPEG', quality=95)
            except Exception as e:
                print(f"Warning: Could not fix orientation for {target_path}: {e}")

        return processed_path

    def __del__(self):
        # Cleanup temp files
        for img in getattr(self, 'temp_images', []):
            try:
                if os.path.exists(img):
                    os.remove(img)
            except: pass

    def header(self):
        if self.page_no() > 1:
            self.set_font(FONT_PRIMARY, '', 8)
            self.set_text_color(120)
            self.cell(0, 10, 'PROJEKT: SAUERBRUCH 3 | DOKUMENTATION 2026', align='L', new_x=XPos.RIGHT, new_y=YPos.TOP)
            self.cell(0, 10, 'REVISION: 2.2', align='R', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            self.set_draw_color(*C_GRAY_DIVIDER)
            self.line(MARGIN_L, 22, 210 - MARGIN_R, 22)
            self.ln(10)

    def footer(self):
        self.set_y(-20)
        self.set_font(FONT_PRIMARY, '', 8)
        self.set_text_color(150)
        self.set_draw_color(*C_GRAY_DIVIDER)
        self.line(MARGIN_L, 277, 210 - MARGIN_R, 277)
        self.cell(100, 10, 'ARCHITEKTUR & PLANUNG | SAUERBRUCH 3', align='L')
        self.cell(0, 10, f'SEITE {self.page_no()}', align='R')

    def add_toc_entry(self, title, level=0):
        link_id = self.add_link()
        self.set_link(link_id, page=self.page_no())
        self.toc_data.append({'title': title, 'level': level, 'page': self.page_no(), 'link': link_id})

    def draw_section_divider(self, color=C_SLATE, width=40):
        self.set_draw_color(*color)
        self.set_line_width(0.5)
        y = self.get_y()
        self.line(self.get_x(), y, self.get_x() + width, y)
        self.set_line_width(0.2)
        self.ln(3)

    def render_cover(self):
        self.add_page()
        self.set_fill_color(*C_SLATE)
        self.rect(0, 0, 210, 297, 'F')
        self.set_fill_color(*C_BLUE)
        self.rect(MARGIN_L, 60, 3, 50, 'F')
        self.set_xy(MARGIN_L + 10, 60)
        self.set_font(FONT_PRIMARY, 'B', 54)
        self.set_text_color(255)
        self.cell(0, 22, 'SAUERBRUCH', align='L', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_x(MARGIN_L + 10)
        self.set_font(FONT_PRIMARY, '', 32)
        self.cell(0, 15, '03', align='L', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(5)
        self.set_x(MARGIN_L + 10)
        self.set_font(FONT_PRIMARY, 'B', 14)
        self.set_text_color(200)
        self.cell(0, 10, 'ARCHITEKTUR-SPEZIFIKATION & LEISTUNGSVERZEICHNIS', align='L', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_y(-50)
        self.set_font(FONT_PRIMARY, '', 10)
        self.set_text_color(180)
        self.cell(0, 6, 'AUSGABE MÄRZ 2026', align='R', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.cell(0, 6, 'VERSION 2.2 (SPECIFICATION)', align='R', new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    def render_toc(self):
        self.add_page()
        self.set_font(FONT_PRIMARY, 'B', 32)
        self.set_text_color(*C_SLATE)
        self.cell(0, 30, 'INHALTSVERZEICHNIS', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.draw_section_divider(width=60)
        self.ln(10)
        self.toc_start_y = self.get_y()

    def finalize_toc(self):
        self.page = 2
        self.set_y(self.toc_start_y)
        for entry in self.toc_data:
            indent = entry['level'] * 8
            self.set_x(MARGIN_L + indent)
            is_main = entry['level'] == 0
            self.set_font(FONT_PRIMARY, 'B' if is_main else '', 11 if is_main else 10)
            self.set_text_color(*(C_SLATE if is_main else C_TEXT))
            title = clean_text(entry['title'])
            self.cell(140 - indent, 10, title, border='B', align='L', link=entry['link'])
            self.cell(20, 10, str(entry['page']), border='B', align='R', new_x=XPos.LMARGIN, new_y=YPos.NEXT, link=entry['link'])

    def render_summary(self, total_area, total_cost):
        self.add_page()
        self.add_toc_entry('PROJEKT-ÜBERSICHT & BUDGET')
        self.set_font(FONT_PRIMARY, 'B', 28)
        self.set_text_color(*C_SLATE)
        self.cell(0, 20, 'PROJEKT-ÜBERSICHT & BUDGET', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.draw_section_divider(width=50)
        self.ln(5)

        # Subtle info text instead of a box
        self.set_font(FONT_PRIMARY, 'I', 9)
        self.set_text_color(100)
        self.multi_cell(0, 5, "Grundlage für Ausschreibung und Vergabe. Maße nach bestem Wissen; zur Prüfung der Mengen dienen die in Klammern angegebenen Herleitungen.", align='L', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(15)

        def draw_stat(label, value, x_pos, y_pos):
            self.set_xy(x_pos, y_pos)
            self.set_fill_color(*C_GRAY_LIGHT)
            self.rect(x_pos, y_pos, 75, 28, 'F')
            self.set_xy(x_pos + 6, y_pos + 6)
            self.set_font(FONT_PRIMARY, '', 9)
            self.set_text_color(100)
            self.cell(63, 5, label, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            self.set_x(x_pos + 6)
            self.ln(2)
            self.set_x(x_pos + 6)
            self.set_font(FONT_PRIMARY, 'B', 15)
            self.set_text_color(*C_SLATE)
            self.cell(63, 10, value)
        start_y = self.get_y()
        draw_stat('GESAMTFLÄCHE NETTO', f'{total_area:.2f} m2', MARGIN_L, start_y)
        draw_stat('KALKULIERTE GESAMTKOSTEN', f'{total_cost:,.2f} EUR'.replace(',', 'X').replace('.', ',').replace('X', '.'), MARGIN_L + 85, start_y)
        self.set_y(start_y + 40)

    def render_room(self, index, room):
        self.add_page()
        self.add_toc_entry(room.name, 0)
        self.rendered_images = set()  # Track rendered images for this room
        
        self.set_fill_color(*C_GRAY_LIGHT)
        self.rect(0, 0, 210, 65, 'F')
        
        # Room inspiration image in header (right side)
        inspiration_imgs = room.images.get('inspiration', [])
        if inspiration_imgs:
            # Look for a "titel" image first
            header_img_path = next((img for img in inspiration_imgs if "titel" in os.path.basename(img).lower()), inspiration_imgs[0])
            header_img = self._resolve_image_path(room.path, header_img_path)
            if header_img:
                self.rendered_images.add(header_img) # Mark as rendered
                try:
                    # Target dimensions for the header image
                    target_w, target_h = 80, 50
                    target_x, target_y = 115, 7
                    
                    # 1. Shadow (subtle gray offset)
                    self.set_fill_color(200, 200, 200)
                    self.rect(target_x + 1, target_y + 1, target_w, target_h, 'F')
                    
                    # 2. White Border
                    self.set_fill_color(255, 255, 255)
                    self.rect(target_x - 1, target_y - 1, target_w + 2, target_h + 2, 'F')
                    
                    # 3. Crop-to-fit the image using PIL to avoid distortion
                    if Image and ImageOps:
                        with Image.open(header_img) as img:
                            # Use ImageOps.fit to crop the image to the target aspect ratio
                            fit_img = ImageOps.fit(img, (target_w * 10, target_h * 10), centering=(0.5, 0.5))
                            temp_fd, temp_path = tempfile.mkstemp(suffix='.jpg')
                            os.close(temp_fd)
                            fit_img.convert('RGB').save(temp_path, 'JPEG', quality=95)
                            self.temp_images.append(temp_path)
                            self.image(temp_path, x=target_x, y=target_y, w=target_w, h=target_h)
                    else:
                        # Fallback if PIL fails
                        self.image(header_img, x=target_x, y=target_y, w=target_w, h=target_h)
                except Exception as e:
                    print(f"Warning: Could not render header image: {e}")

        self.set_xy(MARGIN_L, 25)
        self.set_font(FONT_PRIMARY, 'B', 48)
        self.set_text_color(230) 
        self.cell(0, 15, f'{index+1:02}', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_x(MARGIN_L)
        self.set_font(FONT_PRIMARY, 'B', 32)
        self.set_text_color(*C_SLATE)
        self.cell(0, 15, room.name, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_x(MARGIN_L)
        self.set_font(FONT_PRIMARY, '', 10)
        self.set_text_color(120)
        self.cell(60, 8, f'FLÄCHE: {room.area:.2f} m2', align='L')
        status_color = C_STATUS_PLAN
        if 'todo' in room.status.lower(): status_color = C_STATUS_TODO
        elif 'erledigt' in room.status.lower() or 'fertig' in room.status.lower(): status_color = C_STATUS_DONE
        self.set_fill_color(*status_color)
        self.set_text_color(255)
        self.set_font(FONT_PRIMARY, 'B', 8)
        status_text = room.status.upper()
        tw = self.get_string_width(status_text) + 6
        self.cell(tw, 6, status_text, fill=True, align='C')
        self.ln(30)
        
        for section in room.sections:
            if not section.items: continue
            if self.get_y() > 250: self.add_page()
            self.ln(5)
            sec_color = C_SLATE
            if 'todo' in section.key: sec_color = C_STATUS_TODO
            elif 'ablauf' in section.key: sec_color = C_BLUE
            self.set_font(FONT_PRIMARY, 'B', 12)
            self.set_text_color(*sec_color)
            self.cell(0, 10, clean_text(section.title), new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            self.draw_section_divider(color=sec_color, width=30)
            if section.is_table:
                self.render_table(section.items, room)
            else:
                is_sequence = 'ablauf' in section.key or 'reihenfolge' in section.key
                
                # Iterate with index to allow peeking/grouping
                i = 0
                while i < len(section.items):
                    item = section.items[i]
                    
                    # Check if current item is an image
                    img_match = re.search(r'!\[.*?\]\((.*?)\)', item)
                    if img_match:
                        # Collect consecutive images
                        img_group = []
                        while i < len(section.items):
                            m = re.search(r'!\[.*?\]\((.*?)\)', section.items[i])
                            if not m: break
                            img_p = self._resolve_image_path(room.path, m.group(1))
                            if img_p: 
                                img_group.append(img_p)
                                self.rendered_images.add(img_p) # Mark as rendered
                            i += 1
                        
                        if img_group:
                            self.render_image_grid(img_group)
                        continue

                    # Regular text rendering
                    if self.get_y() > 270: self.add_page()
                    self.set_x(MARGIN_L + 5)
                    self.set_font(FONT_PRIMARY, '', 10)
                    self.set_text_color(*C_TEXT)
                    prefix = f'{i+1}. ' if is_sequence else '- '
                    self.multi_cell(0, 6, f'{prefix}{clean_text(item)}', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
                    self.ln(1)
                    i += 1
        self.render_images(room)

    def render_image_grid(self, img_paths):
        if not img_paths: return
        
        total_w = 210 - MARGIN_L - MARGIN_R
        gutter = 4
        
        # Decide how many columns based on image count
        cols = 2 if len(img_paths) >= 2 else 1
        if len(img_paths) == 3: cols = 3
        
        col_w = (total_w - (cols - 1) * gutter) / cols
        limit_h = 75 if cols == 2 else 50
        
        idx = 0
        while idx < len(img_paths):
            # Calculate row height before deciding on page break
            row_imgs = img_paths[idx:idx+cols]
            row_heights = []
            for p in row_imgs:
                try:
                    with Image.open(p) as img:
                        w, h = img.size
                        aspect = h / w
                        row_heights.append(min(col_w * aspect, limit_h))
                except:
                    row_heights.append(10)
            
            max_row_h = max(row_heights) if row_heights else 0
            
            # Page break if row doesn't fit (considering footer space)
            if self.get_y() + max_row_h > 270:
                self.add_page()
            
            y_before = self.get_y()
            for c, img_path in enumerate(row_imgs):
                x = MARGIN_L + c * (col_w + gutter)
                try:
                    with Image.open(img_path) as img:
                        w, h = img.size
                        aspect = h / w
                        display_h = min(col_w * aspect, limit_h)
                        display_w = display_h / aspect if display_h < col_w * aspect else col_w
                        
                        # Center in column horizontally
                        x_offset = (col_w - display_w) / 2
                        self.image(img_path, x=x + x_offset, y=y_before, w=display_w, h=display_h)
                except Exception as e:
                    self.set_xy(x, y_before)
                    self.set_font(FONT_PRIMARY, 'I', 7)
                    self.cell(col_w, 10, f"[IMG ERR]", border=1, align='C')
                
                idx += 1
            
            self.set_y(y_before + max_row_h + gutter)
        self.ln(2)

    def render_table(self, items, room):
        if not items: return
        col_count = len(items[0])
        total_w = 210 - MARGIN_L - MARGIN_R
        if col_count == 5:
            ws = [total_w * 0.45, 15, 15, 25, 30] 
        elif col_count == 6:
            ws = [total_w * 0.35, total_w * 0.15, 12, 12, 22, 28] 
        else:
            if col_count == 2:
                ws = [total_w * 0.3, total_w * 0.7]
            else:
                ws = [total_w / col_count] * col_count
        self.set_font(FONT_PRIMARY, '', 8)
        for row_idx, row in enumerate(items):
            if self.get_y() > 260: self.add_page()
            is_header = row_idx == 0 and any(h in row[0].upper() for h in ['POSTEN', 'PLAN-SKIZZE', 'OBJEKT'])
            if is_header:
                self.set_fill_color(*C_SLATE)
                self.set_text_color(255)
                self.set_font(FONT_PRIMARY, 'B', 8)
            else:
                self.set_fill_color(255)
                self.set_text_color(*C_TEXT)
                self.set_font(FONT_PRIMARY, '', 8)
            clean_row = []
            row_images = {}
            row_heights = [6]
            for i, val in enumerate(row):
                if i >= len(ws): break
                img_match = re.search(r'!\[.*?\]\((.*?)\)', val)
                if img_match:
                    img_path = self._resolve_image_path(room.path, img_match.group(1))
                    if img_path:
                        row_images[i] = img_path
                        self.rendered_images.add(img_path) # Mark as rendered
                        row_heights.append(45)
                        continue
                c_v = clean_text(val)
                if col_count >= 5 and i >= 1: 
                    if '(' in c_v and i != 1: 
                        c_v = c_v.split('(')[0].strip()
                    if i >= col_count - 2 and c_v.replace('.', '').replace(',', '').isdigit():
                        if "EUR" not in c_v: c_v += " EUR"
                clean_row.append(c_v)
            for i, val in enumerate(clean_row):
                if i in row_images:
                    row_heights.append(40)
                else:
                    lines = self.multi_cell(ws[i], 5, val, split_only=True)
                    row_heights.append(max(len(lines), 1) * 6)
            max_h = max(row_heights)
            y_start = self.get_y()
            x_start = MARGIN_L
            for i, val in enumerate(clean_row):
                if i >= len(ws): break
                self.set_xy(x_start, y_start)
                align = 'L'
                if col_count >= 5 and i >= 1: align = 'R'
                if i in row_images:
                    self.rect(x_start, y_start, ws[i], max_h)
                    try:
                        self.image(row_images[i], x=x_start+1, y=y_start+1, w=ws[i]-2, h=max_h-2)
                    except:
                        self.cell(ws[i], max_h, "[BILD FEHLER]", border=1, align='C')
                else:
                    self.multi_cell(ws[i], max_h / (max_h / 6), val, border='B', align=align, fill=is_header)
                x_start += ws[i]
            self.set_y(y_start + max_h)

    def render_images(self, room):
        labels = {'plan': 'PLÄNE & GRUNDRISSE', 'ist': 'IST-ZUSTAND / BESTAND', 'inspiration': 'INSPIRATION & REFERENZEN', 'material': 'MATERIALAUSWAHL'}
        for cat, label in labels.items():
            imgs = room.images.get(cat, [])
            if not imgs: continue
            
            # Filter out images already rendered in sections
            remaining_imgs = []
            for img_p in imgs:
                res_p = self._resolve_image_path(room.path, img_p)
                if res_p and res_p not in getattr(self, 'rendered_images', set()):
                    remaining_imgs.append(res_p)
            
            if not remaining_imgs: continue # Skip category if no new images
            
            # Header check
            if self.get_y() > 240: self.add_page()
            
            self.ln(10)
            self.set_font(FONT_PRIMARY, 'B', 11)
            self.set_text_color(*C_SLATE)
            self.cell(0, 10, f'{label} | {room.name}', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            self.set_draw_color(*C_GRAY_DIVIDER)
            self.line(MARGIN_L, self.get_y(), 210 - MARGIN_R, self.get_y())
            self.ln(5)
            
            # Use the unified grid renderer
            self.render_image_grid(remaining_imgs)
