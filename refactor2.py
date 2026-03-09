import re

filepath = '/Users/dobby/sauerbruch/apps/hausplanung/src/app/nx-welcome.ts'
with open(filepath, 'r') as f:
    content = f.read()

# Imports
content = content.replace(
    "import { StatusBadgeComponent } from '../ui/status-badge/status-badge.component';",
    "import { StatusBadgeComponent } from '../ui/status-badge/status-badge.component';\nimport { RoomCardComponent } from '../ui/room-card/room-card.component';"
)
content = content.replace(
    "imports: [CommonModule, RouterModule, StatusBadgeComponent],",
    "imports: [CommonModule, RouterModule, StatusBadgeComponent, RoomCardComponent],"
)

# HTML replacement
old_html = r'''<div \*ngFor="let room of rooms" class="glass-card room-card" \[routerLink\]="\['/room', room\.id\]">
            <div class="room-preview-container">
              <div \*ngFor="let img of getRoomImages\(room\.id\); let i = index" 
                   class="room-preview" 
                   \[class\.active\]="i === currentImageIndices\[room\.id\]"
                   \[style\.backgroundImage\]="'url\(' \+ img \+ '\)'">
              </div>
              <div class="no-preview" \*ngIf="getRoomImages\(room\.id\)\.length === 0">
                <span>Kein Vorschaubild</span>
              </div>
            </div>
            <div class="room-overlay"></div>
            <div class="room-content-wrapper">
              <div class="room-info">
                <h3>\{\{ room\.name \}\}</h3>
                <p>\{\{ room\.area \}\} m² <span class="derivation-hint">\(\{\{ room\.area_derivation \}\}\)</span></p>
                <app-status-badge \[status\]="room\.status"></app-status-badge>
              </div>
            </div>
          </div>'''

new_html = '<app-room-card *ngFor="let room of rooms" [room]="room" [images]="getRoomImages(room.id)" [currentImageIndex]="currentImageIndices[room.id]"></app-room-card>'

content = re.sub(old_html, new_html, content)

# Remove styles
styles_to_remove = [
    r'\.room-card\s*\{[^}]+\}',
    r'\.room-card:hover\s*\{[^}]+\}',
    r'\.room-preview-container\s*\{[^}]+\}',
    r'\.room-preview\s*\{[^}]+\}',
    r'\.room-preview\.active\s*\{[^}]+\}',
    r'\.room-card:hover\s*\.room-preview\.active\s*\{[^}]+\}',
    r'\.no-preview\s*\{[^}]+\}',
    r'\.room-overlay\s*\{[^}]+\}',
    r'\.room-content-wrapper\s*\{[^}]+\}',
    r'\.room-info\s*h3\s*\{[^}]+\}',
    r'\.room-info\s*p\s*\{[^}]+\}',
    r'\.derivation-hint\s*\{[^}]+\}'
]

for pattern in styles_to_remove:
    content = re.sub(pattern, '', content)

with open(filepath, 'w') as f:
    f.write(content)

print("Refactored room card in nx-welcome")
