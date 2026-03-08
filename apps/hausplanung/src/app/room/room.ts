import { Component, OnInit, OnDestroy, signal, Inject, PLATFORM_ID } from '@angular/core';
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
    <div class="room-page" *ngIf="!error(); else errorTpl">
      <header class="room-banner">
        <!-- Before/After Animation Container (Manual Slider removed) -->
        <div class="slider-container" *ngIf="beforeImage() && afterImage(); else staticHero">
          <div class="image-before" [style.backgroundImage]="'url(' + beforeImage() + ')'"></div>
          <div class="image-after" [style.backgroundImage]="'url(' + afterImage() + ')'" [style.clipPath]="'inset(0 0 0 ' + (100 - sliderPos()) + '%)'"></div>
          
          <!-- Only the dividing line remains for visual separation -->
          <div class="slider-line" [style.left]="sliderPos() + '%'"></div>

          <div class="label label-before">IST-ZUSTAND</div>
          <div class="label label-after">PLANUNG</div>
        </div>


        <ng-template #staticHero>
          <div class="static-hero" [style.backgroundImage]="heroImage() ? 'url(' + heroImage() + ')' : 'none'"></div>
        </ng-template>

        <div class="banner-overlay"></div>
        <div class="banner-content">
          <div class="breadcrumb mobile-breadcrumb">
            <a routerLink="/">Dashboard</a> / {{ roomDetails()?.name || roomName() }}
          </div>
          <h1 class="room-title">{{ roomDetails()?.name || roomName() }}</h1>
          
          <div class="quick-stats">
            <div class="glass-card stat-pill">
              <span class="pill-label">Status</span>
              <span class="badge" [ngClass]="getStatusClass(roomDetails()?.status)">{{ roomDetails()?.status }}</span>
            </div>
            <div class="glass-card stat-pill">
              <span class="pill-label">Fläche</span>
              <span class="pill-value">{{ roomDetails()?.area }} m²</span>
            </div>
            <div class="glass-card stat-pill" *ngIf="roomDetails()?.budget">
              <span class="pill-label">Budget</span>
              <span class="pill-value">{{ roomDetails()?.budget | number:'1.0-0':'de-DE' }} €</span>
            </div>
          </div>
        </div>
      </header>

      <div class="layout-grid">
        <main class="main-content">
          <section class="glass-card details-card">
            <div class="card-header">
              <h2>Planungsdetails</h2>
              <div class="derivation" *ngIf="roomDetails()?.area_derivation">
                <strong>Herleitung:</strong> {{ roomDetails()?.area_derivation }}
              </div>
            </div>
            <div class="markdown-body" [innerHTML]="content()"></div>
          </section>
        </main>
        
        <aside class="side-content">
          <section class="media-section" *ngIf="images().length > 0">
            <h3 class="section-label">Medien & Pläne</h3>
            <div class="gallery-grid">
              <div *ngFor="let img of images()" class="glass-card image-wrapper" (click)="openImage(img)">
                <img [src]="img" [alt]="img">
                <div class="img-overlay">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><line x1="11" x1="8" x2="11" y2="14"/><line x1="8" x1="11" x2="14" y2="11"/></svg>
                </div>
              </div>
            </div>
          </section>

          <section class="actions-section">
            <h3 class="section-label">Aktionen</h3>
            <div class="action-buttons">
              <button class="btn-primary full-width">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x1="15" x2="12" y2="3"/></svg>
                PDF Export
              </button>
            </div>
          </section>
        </aside>
      </div>
    </div>

    <ng-template #errorTpl>
      <div class="error-view glass-card">
        <div class="error-icon">⚠️</div>
        <h2>Raum nicht gefunden</h2>
        <p>Die Planungsdaten für "{{ roomName() }}" konnten nicht geladen werden.</p>
        <a routerLink="/" class="btn-primary">Zurück zum Dashboard</a>
      </div>
    </ng-template>
  `,
  styles: [`
    .room-page { animation: fadeIn 0.4s ease-out; }

    .room-banner {
      height: 450px;
      margin: -2.5rem -2.5rem 2.5rem -2.5rem;
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: flex-end;
      padding: 4rem;
      background-color: var(--sidebar-bg);
    }

    .static-hero, .image-before, .image-after {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      background-size: cover;
      background-position: center;
    }

    .slider-container {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
    }

    .slider-control {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      z-index: 1;
    }

    .slider-input {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      opacity: 0;
      cursor: ew-resize;
      margin: 0;
      z-index: 15;
    }

    .slider-line {
      position: absolute;
      top: 0; bottom: 0;
      width: 2px;
      background: white;
      box-shadow: 0 0 10px rgba(0,0,0,0.5);
      pointer-events: none;
      z-index: 12;
    }

    .slider-handle {
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      width: 56px; height: 56px; /* Increased for better touch */
      background: white;
      border-radius: 50%;
      display: flex;
      align-items: center; justify-content: center;
      box-shadow: 0 4px 25px rgba(0,0,0,0.5);
      color: var(--primary-color);
      border: 3px solid var(--primary-color);
      z-index: 20;
    }

    .slider-handle svg {
      width: 28px;
      height: 28px;
    }

    .label {
      position: absolute;
      bottom: 2rem;
      padding: 0.6rem 1.2rem; /* Slightly larger padding */
      background: rgba(0,0,0,0.8); /* Higher contrast */
      color: white;
      font-size: 0.75rem;
      font-weight: 900;
      border-radius: 8px;
      backdrop-filter: blur(10px);
      z-index: 5;
      border: 1px solid rgba(255,255,255,0.2);
    }

    .label-before { left: 2rem; }
    .label-after { right: 2rem; }

    .banner-overlay {
      position: absolute; top: 0; left: 0; right: 0; bottom: 0;
      background: linear-gradient(to top, var(--bg-color) 0%, rgba(2, 6, 23, 0.2) 100%);
      pointer-events: none;
      z-index: 2;
    }

    .banner-content { position: relative; z-index: 5; width: 100%; pointer-events: none; }
    .banner-content * { pointer-events: auto; }
    
    .room-title { 
      font-size: 4.5rem; font-weight: 900; margin: 0 0 2rem 0; 
      letter-spacing: -0.03em; line-height: 1; 
      text-shadow: 0 2px 10px rgba(0,0,0,0.5);
    }

    .quick-stats { display: flex; gap: 1rem; flex-wrap: wrap; }
    .stat-pill { padding: 0.75rem 1.25rem; display: flex; align-items: center; gap: 1rem; border-radius: 16px; backdrop-filter: blur(15px); }
    .pill-label { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.7; }
    .pill-value { font-weight: 700; font-size: 1.1rem; }

    .layout-grid { display: grid; grid-template-columns: 1fr 340px; gap: 2.5rem; }

    .details-card { padding: 3rem; }
    .card-header { margin-bottom: 2.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid var(--border-color); }
    .card-header h2 { margin: 0 0 0.5rem 0; font-size: 1.5rem; }
    .derivation { font-size: 0.9rem; opacity: 0.5; font-style: italic; }

    .markdown-body { line-height: 1.8; font-size: 1.1rem; }
    :host ::ng-deep .markdown-body h1 { display: none; }
    :host ::ng-deep .markdown-body h2 { color: var(--primary-color); font-size: 1.25rem; margin-top: 2rem; }
    :host ::ng-deep .markdown-body p { margin-bottom: 1.25rem; }
    :host ::ng-deep .markdown-body ul { padding-left: 1.5rem; margin-bottom: 1.5rem; }

    .section-label { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.4; margin-bottom: 1.25rem; }

    .gallery-grid { display: grid; grid-template-columns: 1fr; gap: 1.25rem; }
    .image-wrapper { position: relative; padding: 0.5rem; cursor: pointer; border-radius: 14px; overflow: hidden; }
    .image-wrapper img { width: 100%; border-radius: 10px; display: block; transition: transform 0.4s ease; }
    .img-overlay { 
      position: absolute; top: 0; left: 0; right: 0; bottom: 0; 
      background: rgba(59, 130, 246, 0.4); display: flex; align-items: center; justify-content: center;
      opacity: 0; transition: opacity 0.3s; color: white;
    }
    .image-wrapper:hover img { transform: scale(1.05); }
    .image-wrapper:hover .img-overlay { opacity: 1; }

    .full-width { width: 100%; }
    .actions-section { margin-top: 3rem; }

    .error-view { padding: 5rem; text-align: center; max-width: 600px; margin: 4rem auto; }
    .error-icon { font-size: 4rem; margin-bottom: 1.5rem; }

    @media (max-width: 1100px) {
      .layout-grid { grid-template-columns: 1fr; gap: 1.5rem; }
      .room-title { font-size: 3.5rem; }
      .room-banner { height: auto; min-height: 400px; padding: 2.5rem 1.5rem; }
      .details-card { padding: 2rem; }
    }

    @media (max-width: 600px) {
      .room-banner { min-height: 320px; padding: 2rem 1rem 1.5rem 1rem; margin: -1.25rem -1.25rem 1.25rem -1.25rem; }
      .room-title { font-size: 2.25rem; margin-bottom: 1.25rem; }
      .quick-stats { gap: 0.5rem; }
      .stat-pill { padding: 0.5rem 0.75rem; border-radius: 12px; gap: 0.5rem; }
      .pill-label { font-size: 0.6rem; }
      .pill-value { font-size: 0.9rem; }
      .details-card { padding: 1.25rem; border-radius: 16px; }
      .card-header { margin-bottom: 1.5rem; padding-bottom: 1rem; }
      .card-header h2 { font-size: 1.25rem; }
      .markdown-body { font-size: 1rem; }
      .label-before, .label-after { bottom: 1rem; font-size: 0.6rem; padding: 0.35rem 0.65rem; }
      .label-before { left: 1rem; }
      .label-after { right: 1rem; }
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

  `]
})
export class RoomComponent implements OnInit, OnDestroy {
  roomName = signal('');
  roomDetails = signal<any>(null);
  content = signal<SafeHtml>('');
  images = signal<string[]>([]);
  heroImage = signal<string | null>(null);
  beforeImage = signal<string | null>(null);
  afterImage = signal<string | null>(null);
  sliderPos = signal(50);
  error = signal(false);

  private animationInterval: any;

  // Mapping of rooms to their specific images
  // In a real app, this would come from a database or file system scan
  private roomImagesMap: Record<string, string[]> = {
    'bad': [
      'assets/rooms/bad/medien/ist/vorher.png',
      'assets/rooms/bad/medien/inspiration/titel.png',
      'assets/rooms/bad/medien/ist/IMG_9974.jpg', 
      'assets/rooms/bad/medien/ist/IMG_9976.jpg', 
      'assets/rooms/bad/medien/material/fliesen2.jpg', 
      'assets/rooms/bad/medien/plan/grundriss.png',
      'assets/rooms/bad/medien/plan/grundriss_ausschnitt.png'
    ],
    'wc': [
      'assets/rooms/wc/medien/ist/gaestebad_ist.png',
      'assets/rooms/wc/medien/inspiration/titel.jpg',
      'assets/rooms/wc/medien/ist/IMG_9971.jpg', 
      'assets/rooms/wc/medien/ist/IMG_9972.jpg', 
      'assets/rooms/wc/medien/plan/grundriss.JPG', 
      'assets/rooms/wc/medien/plan/plan.JPG',
      'assets/rooms/wc/medien/plan/grundriss_ausschnitt.png'
    ],
    'flur': [
      'assets/rooms/flur/medien/ist/flur_ansicht_eingang.jpg', 
      'assets/rooms/flur/medien/ist/flur_durchgang_wohnzimmer.jpg', 
      'assets/rooms/flur/medien/ist/flur_eingangstuer_innen.jpg', 
      'assets/rooms/flur/medien/ist/flur_garderobe_schrank.jpg', 
      'assets/rooms/flur/medien/ist/flur_schrank_detail.jpg',
      'assets/rooms/flur/medien/ist/flur_treppenaufgang_blick_unten.jpg',
      'assets/rooms/flur/medien/inspiration/flur_fenster_regenbogen.png',
      'assets/rooms/flur/medien/inspiration/kamin_clean_look.jpg',
      'assets/rooms/flur/medien/inspiration/kamin_farbiger_teppich.jpg',
      'assets/rooms/flur/medien/plan/grundriss.JPG',
      'assets/rooms/flur/medien/plan/grundriss_gesamt.png'
    ],
    'wohnraum': [
      'assets/rooms/wohnraum/medien/ist/wohnzimmer_1.jpeg',
      'assets/rooms/wohnraum/medien/plan/grundriss.JPG',
      'assets/rooms/wohnraum/medien/plan/grundriss_gesamt.png',
      'assets/rooms/wohnraum/medien/ist/wohnzimmer_2.jpeg',
      'assets/rooms/wohnraum/medien/ist/wohnzimmer_3.jpeg',
      'assets/rooms/wohnraum/medien/ist/IMG_9983.jpg', 
      'assets/rooms/wohnraum/medien/ist/IMG_6989.jpg', 
      'assets/rooms/wohnraum/medien/ist/IMG_6990.jpg', 
    ],
    'kellerflur': [
      'assets/rooms/kellerflur/medien/ist/kellerflur_ansicht_eingang.jpg', 
      'assets/rooms/kellerflur/medien/plan/grundriss_keller.JPG',
      'assets/rooms/kellerflur/medien/plan/grundriss_detail.png',
      'assets/rooms/kellerflur/medien/ist/kellerflur_treppe_blick_unten.jpg', 
    ],
    'keller_buero': [
      'assets/rooms/keller_buero/medien/ist/ist2.png',
      'assets/rooms/keller_buero/medien/inspiration/soll.png',
      'assets/rooms/keller_buero/medien/inspiration/IMG_0029.png',
      'assets/rooms/keller_buero/medien/inspiration/IMG_0031.png',
      'assets/rooms/keller_buero/medien/plan/grundriss.png'
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

  ngOnDestroy() {
    this.stopAnimation();
  }

  loadRoomData(roomId: string) {
    this.roomName.set(roomId);
    this.error.set(false);
    this.stopAnimation();
    
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
          
          const roomImgs = this.roomImagesMap[roomId] || [];
          this.images.set(roomImgs);

          // Setup Before/After logic
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
    const cycleDuration = 24000; // 24 seconds for a full loop (12s each way)
    
    this.animationInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      // Smooth oscillation using sine wave starting from 0%
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

  getStatusClass(status: string): string {
    switch (status) {
      case 'Angefangen': return 'status-active';
      case 'In Planung': return 'status-planned';
      case 'Fertig': return 'status-finished';
      case 'On hold': return 'status-onhold';
      default: return 'status-planned';
    }
  }

  openImage(url: string) {
    window.open(url, '_blank');
  }
}
