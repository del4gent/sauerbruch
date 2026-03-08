import { Component, OnInit, signal, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { marked } from 'marked';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import roomsData from '../../../public/assets/data/rooms.json';

@Component({
  selector: 'app-room',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="room-container" *ngIf="!error(); else errorTpl">
      <header class="room-header">
        <h1 class="gradient-text">{{ roomDetails()?.name || roomName() }}</h1>
        <div class="room-meta">
          <span class="badge status-active">{{ roomDetails()?.status }}</span>
          <span class="badge area">{{ roomDetails()?.area }} m²</span>
        </div>
        <p class="derivation" *ngIf="roomDetails()?.area_derivation">
          <strong>Herleitung:</strong> {{ roomDetails()?.area_derivation }}
        </p>
      </header>

      <div class="content-grid">
        <div class="glass-card md-content" [innerHTML]="content()"></div>
        
        <aside class="media-sidebar" *ngIf="images().length > 0">
          <h2 class="section-title">Medien / Pläne</h2>
          <div class="image-gallery">
            <div *ngFor="let img of images()" class="glass-card image-card">
              <img [src]="img" [alt]="img" (click)="openImage(img)">
            </div>
          </div>
        </aside>
      </div>
    </div>

    <ng-template #errorTpl>
      <div class="error-container glass-card">
        <h2>Raum nicht gefunden</h2>
        <p>Die Planungsdaten für "{{ roomName() }}" konnten nicht geladen werden.</p>
        <a routerLink="/" class="btn-primary">Zurück zum Dashboard</a>
      </div>
    </ng-template>
  `,
  styles: [`
    .room-header { margin-bottom: 3rem; }
    .room-header h1 { font-size: 3.5rem; margin: 0; }
    .room-meta { display: flex; gap: 1rem; margin-top: 1rem; }
    .derivation { margin-top: 1rem; opacity: 0.6; font-style: italic; }
    
    .content-grid { 
      display: grid; 
      grid-template-columns: 1fr 380px; 
      gap: 2.5rem; 
      align-items: start;
    }

    .md-content { 
      padding: 3rem; 
      line-height: 1.8;
      font-size: 1.1rem;
    }

    /* Markdown Styles for Dark Mode */
    :host ::ng-deep h2 { color: var(--primary-color); border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem; margin-top: 2.5rem; }
    :host ::ng-deep ul { padding-left: 1.5rem; }
    :host ::ng-deep li { margin-bottom: 0.75rem; }
    :host ::ng-deep table { width: 100%; border-collapse: collapse; margin: 2rem 0; background: rgba(255,255,255,0.03); border-radius: 12px; overflow: hidden; }
    :host ::ng-deep th, :host ::ng-deep td { padding: 1rem; border: 1px solid var(--border-color); text-align: left; }
    :host ::ng-deep th { background: rgba(255,255,255,0.05); font-weight: 800; }

    .media-sidebar { position: sticky; top: 2rem; }
    .section-title { font-size: 1.2rem; margin-bottom: 1.5rem; opacity: 0.7; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; }
    
    .image-gallery { display: flex; flex-direction: column; gap: 1.5rem; }
    .image-card { padding: 0.75rem; overflow: hidden; }
    .image-card img { width: 100%; border-radius: 12px; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
    .image-card img:hover { transform: scale(1.05); }

    .error-container { padding: 4rem; text-align: center; max-width: 600px; margin: 5rem auto; }

    @media (max-width: 1200px) {
      .content-grid { grid-template-columns: 1fr; }
      .media-sidebar { position: static; }
    }
  `]
})
export class RoomComponent implements OnInit {
  roomName = signal('');
  roomDetails = signal<any>(null);
  content = signal<SafeHtml>('');
  images = signal<string[]>([]);
  error = signal(false);

  // Manual image mapping based on actual file structure
  private roomImages: Record<string, string[]> = {
    'bad': [
      'assets/rooms/bad/medien/ist/IMG_9974.jpg', 
      'assets/rooms/bad/medien/ist/IMG_9976.jpg', 
      'assets/rooms/bad/medien/material/fliesen2.jpg', 
      'assets/rooms/bad/medien/plan/grundriss.png'
    ],
    'wc': [
      'assets/rooms/wc/medien/ist/gaestebad_ist.png',
      'assets/rooms/wc/medien/ist/IMG_9971.jpg', 
      'assets/rooms/wc/medien/ist/IMG_9972.jpg', 
      'assets/rooms/wc/medien/plan/grundriss.JPG', 
      'assets/rooms/wc/medien/plan/plan.JPG'
    ],
    'diele': [
      'assets/rooms/diele/medien/ist/flur_ansicht_eingang.jpg', 
      'assets/rooms/diele/medien/ist/flur_durchgang_wohnzimmer.jpg', 
      'assets/rooms/diele/medien/ist/flur_eingangstuer_innen.jpg', 
      'assets/rooms/diele/medien/ist/flur_schrank_detail.jpg',
      'assets/rooms/diele/medien/plan/grundriss.JPG'
    ],
    'wohnraum': [
      'assets/rooms/wohnraum/medien/ist/wohnzimmer_1.jpeg',
      'assets/rooms/wohnraum/medien/ist/wohnzimmer_2.jpeg',
      'assets/rooms/wohnraum/medien/ist/wohnzimmer_3.jpeg',
      'assets/rooms/wohnraum/medien/ist/wohnzimmer_4.jpeg',
      'assets/rooms/wohnraum/medien/ist/wohnzimmer_5.jpeg',
      'assets/rooms/wohnraum/medien/ist/IMG_9983.jpg', 
      'assets/rooms/wohnraum/medien/ist/IMG_6989.jpg', 
      'assets/rooms/wohnraum/medien/ist/IMG_6990.jpg', 
      'assets/rooms/wohnraum/medien/ist/IMG_6991.jpg', 
      'assets/rooms/wohnraum/medien/ist/IMG_7360.jpg', 
      'assets/rooms/wohnraum/medien/ist/IMG_7861.jpg', 
      'assets/rooms/wohnraum/medien/plan/grundriss.JPG'
    ],
    'kellerflur': [
      'assets/rooms/kellerflur/medien/ist/kellerflur_ansicht_eingang.jpg', 
      'assets/rooms/kellerflur/medien/ist/kellerflur_treppe_blick_unten.jpg', 
      'assets/rooms/kellerflur/medien/plan/grundriss_keller.JPG'
    ],
  };

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.loadRoomData(params['room']);
    });
  }

  loadRoomData(roomId: string) {
    this.roomName.set(roomId);
    this.error.set(false);
    
    const details = (roomsData as any[]).find(r => r.id === roomId);
    this.roomDetails.set(details);

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
          this.images.set(this.roomImages[roomId] || []);
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

  openImage(url: string) {
    window.open(url, '_blank');
  }
}
