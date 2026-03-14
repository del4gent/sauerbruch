import { Component, OnInit, OnDestroy, signal, Inject, PLATFORM_ID, computed, inject } from '@angular/core';
import { StatusBadgeComponent } from '../ui/status-badge/status-badge.component';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import { RoomStore, Room, Material } from '../store/room.store';
import { StatCardComponent } from '../ui/stat-card/stat-card.component';

interface ImageGroup {
  id: string;
  label: string;
  icon: string;
  images: string[];
  materials?: Material[];
}

interface ChecklistItem {
  label: string;
  done: boolean;
}

interface TableData {
  headers: string[];
  rows: string[][];
}

interface RoomSection {
  title: string;
  type: 'checklist' | 'table' | 'text';
  items: ChecklistItem[] | TableData | string;
  html?: SafeHtml;
}

interface RoomData {
  title: string;
  basisdaten: {
    flaeche: string;
    herleitung: string;
    status: string;
  };
  sections: RoomSection[];
}

@Component({
  selector: 'app-room',
  standalone: true,
  imports: [CommonModule, RouterModule, StatusBadgeComponent, StatCardComponent],
  templateUrl: './room.html',
  styleUrl: './room.css',
})
export class RoomComponent implements OnInit, OnDestroy {
  roomName = signal('');
  roomDetails = signal<Room | null>(null);
  roomSections = signal<RoomSection[]>([]);
  images = signal<string[]>([]);
  heroImage = signal<string | null>(null);
  beforeImage = signal<string | null>(null);
  afterImage = signal<string | null>(null);
  sliderPos = signal(0);
  error = signal(false);
  progress = signal<{ total: number; completed: number; percentage: number }>({ total: 0, completed: 0, percentage: 0 });
  upcomingTasks = signal<string[]>([]);
  selectedMaterial = signal<Material | null>(null);
  isAblaufExpanded = signal(false);

  groupedImages = computed(() => {
    const all = this.images();
    const roomId = this.roomName();
    const materials = [...this.roomService.getRoomMaterials(roomId)].sort((a, b) => {
      const order: Record<string, number> = { 'Gekauft': 1, 'Ausgesucht': 2, 'In Auswahl': 3 };
      return (order[a.status] || 99) - (order[b.status] || 99);
    });

    const groups: ImageGroup[] = [
      { 
        id: 'plan', 
        label: 'Pläne', 
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>',
        images: all.filter(img => img.includes('/plan/')) 
      },
      { 
        id: 'soll', 
        label: 'Inspiration', 
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
        images: all.filter(img => img.includes('/inspiration/')) 
      },
      { 
        id: 'material', 
        label: 'Material', 
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>',
        images: materials.length > 0 ? materials.map(m => m.image) : all.filter(img => img.includes('/material/')),
        materials: materials
      },
      { 
        id: 'ist', 
        label: 'Bestand', 
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
        images: all.filter(img => img.includes('/ist/')) 
      }
    ];
    return groups;
  });

  private _allSections = signal<RoomSection[]>([]);
  
  ablaufSection = computed(() => {
    const sections = this._allSections();
    if (!sections || sections.length === 0) return null;
    
    // Robust search for the Ablaufplan section
    const found = sections.find(s => {
      const t = s.title.trim().toUpperCase();
      return t.includes('ABLAUFPLAN') || t.includes('RENOVIERUNGS-ABLAUF') || t.includes('RENOVIERUNGSABLAUF');
    });
    if (found) return found;

    return null;
  });

  public roomService = inject(RoomStore);
  private animationInterval: any;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    public sanitizer: DomSanitizer,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.loadRoomData(params['room']);
    });
  }

  ngOnDestroy() {
    this.stopAnimation();
  }

  loadRoomData(roomId: string) {
    this.roomName.set(roomId);
    this.error.set(false);
    this.isAblaufExpanded.set(false);
    this.stopAnimation();
    
    const details = this.roomService.getRoomById(roomId);
    this.roomDetails.set(details || null);

    if (!details) {
      this.error.set(true);
      return;
    }

    const jsonPath = `assets/${details.path}`;
    
    this.http.get<RoomData>(jsonPath).subscribe({
      next: (data) => {
        // 1. Calculate Progress (from ABLAUFPLAN table or checklists)
        let total = 0;
        let completed = 0;
        const upcoming: string[] = [];

        data.sections.forEach(section => {
          const sectionTitle = section.title.toUpperCase();
          const isAblauf = sectionTitle.includes('ABLAUFPLAN') || 
                           sectionTitle.includes('RENOVIERUNGS-ABLAUF') || 
                           sectionTitle.includes('RENOVIERUNGSABLAUF');

          if (section.type === 'text' && typeof section.items === 'string') {
            try {
              let markdown = section.items;
              // Fix image references: medien/... -> assets/rooms/{roomId}/medien/...
              markdown = markdown.replace(/\]\((medien\/[^)]+)\)/g, `](assets/rooms/${roomId}/$1)`);
              const parsed = marked.parse(markdown);
              section.html = this.sanitizer.bypassSecurityTrustHtml(parsed as string);
            } catch (e) {
              console.error('Markdown parse error', e);
            }
          }
          
          if (section.type === 'table' && typeof section.items !== 'string' && 'rows' in section.items) {
            const table = section.items as TableData;
            // Only count progress from Ablaufplan tables
            if (isAblauf) {
              const statusIndex = table.headers.findIndex(h => h.toUpperCase().includes('STATUS'));
              const titleIndex = Math.max(0, table.headers.findIndex(h => {
                const head = h.toUpperCase();
                return head.includes('TITEL') || head.includes('SCHRITT') || head.includes('GEWERK');
              }));

              table.rows.forEach(row => {
                total++;
                const status = statusIndex !== -1 ? (row[statusIndex]?.toLowerCase() || '') : '';
                if (status === 'fertig' || status === 'erledigt' || status === '✅ fertig') {
                  completed++;
                } else if (upcoming.length < 5) {
                  upcoming.push(row[titleIndex]);
                }
              });
            }
          } else if (section.type === 'checklist' && Array.isArray(section.items)) {
            section.items.forEach(item => {
              total++;
              if (item.done) completed++;
              else if (upcoming.length < 5 && !upcoming.includes(item.label)) upcoming.push(item.label);
            });
          }
        });

        this.progress.set({
          total,
          completed,
          percentage: total > 0 ? Math.round((completed / total) * 100) : 0
        });
        this.upcomingTasks.set(upcoming);
        this._allSections.set(data.sections);

        // 2. Set all sections from JSON
        this.roomSections.set(data.sections);

        // 3. Handle Images
        if (isPlatformBrowser(this.platformId)) {
          const roomImgs = this.roomService.getRoomImages(roomId);
          this.images.set(roomImgs);

          const istImg = roomImgs.find(img => img.includes('/ist/'));
          const planImg = roomImgs.find(img => img.includes('/plan/') || img.includes('/inspiration/'));

          if (istImg && planImg) {
            this.beforeImage.set(planImg);
            this.afterImage.set(istImg);
            this.startAnimation();
          } else {
            this.beforeImage.set(null);
            this.afterImage.set(null);
            this.heroImage.set(roomImgs.length > 0 ? roomImgs[0] : null);
          }
        }
      },
      error: (err) => {
        console.error('Error loading room data:', err);
        this.error.set(true);
      }
    });
  }

  private startAnimation() {
    this.stopAnimation();
    if (!isPlatformBrowser(this.platformId)) return;
    
    const startTime = Date.now();
    const cycleDuration = 24000;
    
    this.animationInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pos = (Math.sin((elapsed / cycleDuration) * 2 * Math.PI - Math.PI / 2) + 1) / 2 * 100;
      this.sliderPos.set(pos);
    }, 20); 
  }

  private stopAnimation() {
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
      this.animationInterval = null;
    }
  }

  openImage(url: string) {
    window.open(url, '_blank');
  }

  onMaterialClick(group: any, index: number, imageUrl: string) {
    if (group.id === 'material' && group.materials) {
      const mat = group.materials[index];
      if (mat.link) {
        window.open(mat.link, '_blank');
      } else {
        this.openImage(imageUrl);
      }
    } else {
      this.openImage(imageUrl);
    }
  }

  onImgError(event: any) {
    event.target.src = 'assets/plan/house_hero.jpg'; // Fallback placeholder
    event.target.classList.add('img-placeholder');
  }

  getProductName(url: string): string {
    const filename = url.split('/').pop()?.toLowerCase() || '';
    if (filename.includes('fliesen')) return 'Wand- und Bodenfliesen (Wells Cream)';
    if (filename.includes('schrank')) return 'Waschtisch-Unterschrank (Eiche)';
    if (filename.includes('armatur')) return 'Waschtisch-Armatur (Unterputz)';
    if (filename.includes('dusche')) return 'Regen-Dusche (Deckeneinbau)';
    if (filename.includes('wc')) return 'Wand-WC (Spülrandlos)';
    if (filename.includes('badewanne')) return 'Einbau-Badewanne (Acryl)';
    if (filename.includes('spiegel')) return 'LED-Spiegel (Rund)';
    if (filename.includes('fenster')) return 'Kunststoff-Fenster (2-fach verglast)';
    if (filename.includes('lampe')) return 'Philips Hue Tento (IP44, Smart Home)';
    if (filename.includes('duschrinne')) return 'Duschrinne (Edelstahl)';
    return filename.replace(/\.[^/.]+$/, "").replace(/_/g, " ");
  }

  getStatusClass(status: string): string {
    const s = status.toLowerCase();
    if (s === 'gekauft') return 'gekauft';
    if (s === 'ausgesucht') return 'ausgesucht';
    if (s === 'in auswahl') return 'noch-aussuchen';
    return '';
  }

  asTable(items: any): TableData {
    return items as TableData;
  }

  asChecklist(items: any): ChecklistItem[] {
    return items as ChecklistItem[];
  }

  isPast(section: RoomSection, index: number): boolean {
    if (section.type === 'checklist' && Array.isArray(section.items)) {
      return (section.items[index] as ChecklistItem).done;
    }
    if (section.type === 'table' && typeof section.items !== 'string' && 'rows' in section.items) {
      const table = section.items as TableData;
      const row = table.rows[index];
      const status = this.getRowStatus(table, row).toLowerCase();
      return status === 'fertig' || status === 'erledigt' || status === '✅ fertig';
    }
    return false;
  }

  isCurrent(section: RoomSection, index: number): boolean {
    if (this.isPast(section, index)) return false;
    // Current is the FIRST item that is NOT past
    for (let i = 0; i < index; i++) {
      if (!this.isPast(section, i)) return false;
    }
    return true;
  }

  isFuture(section: RoomSection, index: number): boolean {
    if (this.isPast(section, index) || this.isCurrent(section, index)) return false;
    return true;
  }

  getRowTitle(table: TableData, row: string[]): string {
    const idx = table.headers.findIndex(h => {
      const t = h.toUpperCase();
      return t.includes('TITEL') || t.includes('SCHRITT') || t.includes('GEWERK');
    });
    return idx !== -1 ? row[idx] : row[0];
  }

  getRowStatus(table: TableData, row: string[]): string {
    const idx = table.headers.findIndex(h => h.toUpperCase().includes('STATUS'));
    return idx !== -1 ? row[idx] : '';
  }

  getRowDescription(table: TableData, row: string[]): string {
    const idx = table.headers.findIndex(h => h.toUpperCase().includes('BESCHREIBUNG'));
    return idx !== -1 ? row[idx] : '';
  }

  getRowExecutionType(table: TableData, row: string[]): string {
    const idx = table.headers.findIndex(h => {
      const header = h.toUpperCase();
      return (
        header.includes('AUSFÜHRUNG') ||
        header.includes('AUSFUHRUNG') ||
        header.includes('VERANTWORTUNG') ||
        header.includes('TYP')
      );
    });
    return idx !== -1 ? row[idx] : '';
  }

  getExecutionTypeClass(type: string): string {
    const normalized = type.trim().toLowerCase();
    if (normalized === 'eigenleistung') return 'eigenleistung';
    if (normalized === 'handwerker') return 'handwerker';
    return '';
  }

  getRowStart(table: TableData, row: string[]): string {
    const idx = table.headers.findIndex(h => {
      const t = h.toUpperCase();
      return t.includes('ANFANG') || t.includes('START');
    });
    return idx !== -1 ? row[idx] : '';
  }

  getRowEnd(table: TableData, row: string[]): string {
    const idx = table.headers.findIndex(h => h.toUpperCase().includes('ENDE'));
    return idx !== -1 ? row[idx] : '';
  }

  getCompletedCount(section: RoomSection): number {
    if (section.type === 'checklist' && Array.isArray(section.items)) {
      return section.items.filter(item => item.done).length;
    }
    if (section.type === 'table' && typeof section.items !== 'string' && 'rows' in section.items) {
      const table = section.items as TableData;
      return table.rows.filter((row, i) => this.isPast(section, i)).length;
    }
    return 0;
  }

  getCurrentIndex(section: RoomSection): number {
    const items = section.type === 'checklist' ? (section.items as ChecklistItem[]) : (section.items as TableData).rows;
    for (let i = 0; i < items.length; i++) {
      if (this.isCurrent(section, i)) return i;
    }
    return -1;
  }

  shouldShowStep(section: RoomSection, index: number): boolean {
    const currentIndex = this.getCurrentIndex(section);
    if (currentIndex === -1) {
      const total = this.getTotalCount(section);
      if (this.getCompletedCount(section) === total) {
        return index === total - 1; // Only show the last one if all done
      }
      return index === 0; // Show first one if none started
    }
    // Only current and the NEXT one
    return index >= currentIndex && index <= currentIndex + 1;
  }

  getRemainingStepsCount(section: RoomSection): number {
    const currentIndex = this.getCurrentIndex(section);
    const total = this.getTotalCount(section);
    if (currentIndex === -1) return 0;
    
    const lastShownIndex = currentIndex + 1;
    const remaining = total - 1 - lastShownIndex;
    return remaining > 0 ? remaining : 0;
  }

  getTotalCount(section: RoomSection): number {
    if (section.type === 'checklist' && Array.isArray(section.items)) {
      return section.items.length;
    }
    if (section.type === 'table' && typeof section.items !== 'string' && 'rows' in section.items) {
      return (section.items as TableData).rows.length;
    }
    return 0;
  }

  getSectionProgress(section: RoomSection): number {
    const total = this.getTotalCount(section);
    if (total === 0) return 0;
    return Math.round((this.getCompletedCount(section) / total) * 100);
  }

  getTaskIcon(label: string): string {
    const l = label.toLowerCase();
    if (l.includes('entkern') || l.includes('abbruch') || l.includes('raus')) return '🔨';
    if (l.includes('elektro') || l.includes('kabel') || l.includes('dose') || l.includes('steckdose')) return '⚡';
    if (l.includes('sanitär') || l.includes('rohr') || l.includes('wasser') || l.includes('leitung')) return '🚰';
    if (l.includes('fliesen') || l.includes('boden')) return '🧱';
    if (l.includes('montage') || l.includes('einbau') || l.includes('setzen')) return '🔧';
    if (l.includes('maler') || l.includes('streich') || l.includes('tapete') || l.includes('putz')) return '🎨';
    if (l.includes('licht') || l.includes('lampe') || l.includes('spot')) return '💡';
    if (l.includes('fenster') || l.includes('tür')) return '🪟';
    if (l.includes('möbel') || l.includes('schrank') || l.includes('küche')) return '🛋️';
    return '📋';
  }

  generatePdf() {
    window.open(`assets/renovierungsplan.pdf`, '_blank');
  }
}
