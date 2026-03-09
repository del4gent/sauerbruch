import { Component, OnInit, OnDestroy, signal, Inject, PLATFORM_ID, computed } from '@angular/core';
import { StatusBadgeComponent } from '../ui/status-badge/status-badge.component';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { marked } from 'marked';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { RoomService, Room } from '../services/room.service';

interface ImageGroup {
  id: string;
  label: string;
  icon: string;
  images: string[];
}

@Component({
  selector: 'app-room',
  standalone: true,
  imports: [CommonModule, RouterModule, StatusBadgeComponent],
  templateUrl: './room.html',
  styleUrl: './room.css',
})
export class RoomComponent implements OnInit, OnDestroy {
  roomName = signal('');
  roomDetails = signal<Room | null>(null);
  content = signal<SafeHtml>('');
  images = signal<string[]>([]);
  heroImage = signal<string | null>(null);
  beforeImage = signal<string | null>(null);
  afterImage = signal<string | null>(null);
  sliderPos = signal(50);
  error = signal(false);

  groupedImages = computed(() => {
    const all = this.images();
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
        images: all.filter(img => img.includes('/material/')) 
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

  private animationInterval: any;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    public sanitizer: DomSanitizer,
    public roomService: RoomService,
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

    const mdPath = `assets/${details.path}`;
    
    this.http.get(mdPath, { responseType: 'text' }).subscribe({
      next: async (md) => {
        if (isPlatformBrowser(this.platformId)) {
          const rendered = await marked.parse(md);
          this.content.set(this.sanitizer.bypassSecurityTrustHtml(rendered));
          
          const roomImgs = this.roomService.getRoomImages(roomId);
          this.images.set(roomImgs);

          const istImg = roomImgs.find(img => img.includes('/ist/'));
          const planImg = roomImgs.find(img => img.includes('/plan/') || img.includes('/inspiration/'));

          if (istImg && planImg) {
            this.beforeImage.set(istImg);
            this.afterImage.set(planImg);
            this.startAnimation();
          } else {
            this.beforeImage.set(null);
            this.afterImage.set(null);
            this.heroImage.set(roomImgs.length > 0 ? roomImgs[0] : null);
          }
        } else {
          this.content.set(md);
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

  onSliderChange(event: Event) {
    this.stopAnimation();
    const value = (event.target as HTMLInputElement).value;
    this.sliderPos.set(parseInt(value));
  }

  openImage(url: string) {
    window.open(url, '_blank');
  }

  generatePdf() {
    window.open(`assets/renovierungsplan.pdf`, '_blank');
  }
}
