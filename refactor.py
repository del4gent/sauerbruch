import re

def refactor_status_badge(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Add import
    if 'StatusBadgeComponent' not in content:
        content = content.replace("from '@angular/core';", "from '@angular/core';\nimport { StatusBadgeComponent } from '../ui/status-badge/status-badge.component';")
        content = content.replace("imports: [CommonModule, RouterModule]", "imports: [CommonModule, RouterModule, StatusBadgeComponent]")
        # for room.ts
        content = content.replace("imports: [CommonModule, RouterModule],", "imports: [CommonModule, RouterModule, StatusBadgeComponent],")

    # Replace badge HTML in nx-welcome
    badge_regex = re.compile(r'<div class="badge" \[ngClass\]="getStatusClass\([^)]+\)">\s*<span class="status-dot"></span>\s*{{ [^}]+ }}\s*</div>')
    
    if 'nx-welcome' in filepath:
        content = re.sub(r'<div class="badge" \[ngClass\]="getStatusClass\(room\.status\)">\s*<span class="status-dot"></span>\s*\{\{ room\.status \}\}\s*</div>', 
                         '<app-status-badge [status]="room.status"></app-status-badge>', content)
    elif 'room.ts' in filepath:
        content = re.sub(r'<div class="badge" \[ngClass\]="getStatusClass\(roomDetails\(\)\?\.status\)">\s*<span class="status-dot"></span>\s*\{\{ roomDetails\(\)\?\.status \}\}\s*</div>', 
                         '<app-status-badge [status]="roomDetails()?.status"></app-status-badge>', content)

    # Remove getStatusClass method
    status_method_regex = re.compile(r'getStatusClass\(status: string\): string \{\s*switch \(status\) \{\s*case \'Angefangen\': return \'status-active\';\s*case \'In Planung\': return \'status-planned\';\s*case \'Fertig\': return \'status-finished\';\s*case \'On hold\': return \'status-onhold\';\s*default: return \'status-planned\';\s*\}\s*\}')
    content = status_method_regex.sub('', content)

    # Remove styles
    styles_to_remove = [
        r'\.badge\s*\{[^}]+\}',
        r'\.status-dot\s*\{[^}]+\}',
        r'\.status-active\s*\{[^}]+\}',
        r'\.status-active \.status-dot\s*\{[^}]+\}',
        r'\.status-planned\s*\{[^}]+\}',
        r'\.status-planned \.status-dot\s*\{[^}]+\}',
        r'\.status-onhold\s*\{[^}]+\}',
        r'\.status-onhold \.status-dot\s*\{[^}]+\}',
        r'\.status-finished\s*\{[^}]+\}',
        r'\.status-finished \.status-dot\s*\{[^}]+\}'
    ]
    for pattern in styles_to_remove:
        content = re.sub(pattern, '', content)

    # Also remove the exact dashboard status styling comment
    content = content.replace("/* EXACT DASHBOARD STATUS STYLING */", "")

    with open(filepath, 'w') as f:
        f.write(content)

refactor_status_badge('/Users/dobby/sauerbruch/apps/hausplanung/src/app/nx-welcome.ts')
refactor_status_badge('/Users/dobby/sauerbruch/apps/hausplanung/src/app/room/room.ts')

print("Refactored status badge in nx-welcome and room")
