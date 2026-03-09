import { Component, OnInit, OnDestroy, signal, Inject, PLATFORM_ID, computed, inject } from '@angular/core';
import { StatusBadgeComponent } from '../ui/status-badge/status-badge.component';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { marked } from 'marked';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
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
  sliderPos = signal(50);
  error = signal(false);
  progress = signal<{ total: number; completed: number; percentage: number }>({ total: 0, completed: 0, percentage: 0 });
  upcomingTasks = signal<string[]>([]);
  selectedMaterial = signal<Material | null>(null);
  isAblaufExpanded = signal(false);

  groupedImages = computed(() => {
    const all = this.images();
    const roomId = this.roomName();
    const materials = this.roomService.getRoomMaterials(roomId);

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
          const isAblauf = section.title.toUpperCase() === 'ABLAUFPLAN';
          
          if (section.type === 'table' && typeof section.items !== 'string' && 'rows' in section.items) {
            const table = section.items as TableData;
            table.rows.forEach(row => {
              total++;
              const status = row[1]?.toLowerCase() || '';
              if (status === 'fertig' || status === 'erledigt' || status === '✅ fertig') {
                completed++;
              } else if (upcoming.length < 5) {
                upcoming.push(row[0]);
              }
            });
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

        // 2. Filter sections for main content
        // We show everything EXCEPT "BASISDATEN" and "IST-ZUSTAND"
        // ABLAUFPLAN stays in main content now as requested
        this.roomSections.set(data.sections.filter(s => 
          !['BASISDATEN', 'IST-ZUSTAND'].includes(s.title.toUpperCase())
        ));

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
      const pos = (Math.sin((elapsed / cycleDuration) * 2 * Math.PI + Math.PI / 2) + 1) / 2 * 100;
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
    if (filename.includes('fenster')) return 'Kunststoff-Fenster (3-fach verglast)';
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

  generatePdf() {
    window.open(`assets/renovierungsplan.pdf`, '_blank');
  }
}
