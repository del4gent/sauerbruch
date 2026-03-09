import os

# Pfade
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAEUME_DIR = os.path.join(BASE_DIR, 'rooms')
MASTER_MD_PATH = os.path.join(BASE_DIR, 'PROJEKT_DETAILS.md')
PDF_PATH = os.path.join(BASE_DIR, 'renovierungsplan.pdf')
ROOMS_JSON_PATH = os.path.join(BASE_DIR, 'data/rooms.json')
PROJECT_JSON_PATH = os.path.join(BASE_DIR, 'data/project.json')

# Architektur-Farbpalette
C_SLATE = (44, 62, 80)
C_BLUE = (52, 152, 219)
C_TEXT = (40, 40, 40)
C_GRAY_LIGHT = (248, 249, 250)
C_GRAY_DIVIDER = (220, 225, 230)

# Status Colors
C_STATUS_DONE = (46, 204, 113)   # Green
C_STATUS_WORK = (219, 39, 119)   # Vibrant Magenta
C_STATUS_PLAN = (243, 156, 18)   # Orange
C_STATUS_PAUSED = (149, 165, 166) # Gray
C_STATUS_TODO = (231, 76, 60)    # Red

# Fonts & Layout
FONT_PRIMARY = "helvetica"
MARGIN_L = 25
MARGIN_R = 25
MARGIN_T = 25
MARGIN_B = 25
