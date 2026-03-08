import { Component, OnInit, OnDestroy, signal, Inject, PLATFORM_ID, computed } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { marked } from 'marked';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import roomsData from '../../../public/assets/data/rooms.json';

interface ImageGroup {
  id: string;
  label: string;
  icon: string;
  images: string[];
}

@Component({
  selector: 'app-room',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="room-page" *ngIf="!error(); else errorTpl">
      <!-- HERO SECTION -->
      <section class="room-hero">
        <div class="slider-container" *ngIf="beforeImage() && afterImage(); else staticHero">
          <div class="image-before" [style.backgroundImage]="'url(' + beforeImage() + ')'"></div>
          <div class="image-after" [style.backgroundImage]="'url(' + afterImage() + ')'" [style.clipPath]="'inset(0 0 0 ' + (100 - sliderPos()) + '%)'"></div>
          
          <div class="slider-line" [style.left]="sliderPos() + '%'">
            <div class="slider-handle">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m18 8 4 4-4 4M6 8l-4 4 4 4"/></svg>
            </div>
          </div>

          <input type="range" min="0" max="100" [value]="sliderPos()" (input)="onSliderChange($event)" class="slider-input">
        </div>

        <ng-template #staticHero>
          <div class="static-hero" [style.backgroundImage]="heroImage() ? 'url(' + heroImage() + ')' : 'none'">
            <div class="hero-placeholder" *ngIf="!heroImage()">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
              <span>Kein Vorschaubild verfügbar</span>
            </div>
          </div>
        </ng-template>

        <div class="hero-overlay"></div>

        <!-- INTEGRATED MINIMAL HEADER -->
        <div class="hero-content-wrapper">
          <nav class="minimal-breadcrumb">
            <a routerLink="/">Dashboard</a> / {{ roomDetails()?.name || roomName() }}
          </nav>
          <h1 class="minimal-title">{{ roomDetails()?.name || roomName() }}</h1>
          
          <div class="hero-meta">
            <p class="area-text">
              {{ roomDetails()?.area }} m² 
              <span class="derivation-hint" *ngIf="roomDetails()?.area_derivation">({{ roomDetails()?.area_derivation }})</span>
            </p>
            <div class="badge" [ngClass]="getStatusClass(roomDetails()?.status)">
              <span class="status-dot"></span>
              {{ roomDetails()?.status }}
            </div>
          </div>
        </div>
      </section>

      <!-- CONTENT LAYOUT -->
      <div class="content-container">
        <div class="main-layout">
          <main class="primary-content">
            <section class="glass-card documentation-section">
              <div class="card-header-accent">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                <h2>Projektbeschreibung</h2>
              </div>
              <div class="markdown-body" [innerHTML]="content()"></div>
            </section>

            <!-- GROUPED MEDIA SECTIONS -->
            <div class="media-container">
              <ng-container *ngFor="let group of groupedImages()">
                <section class="media-group-section" *ngIf="group.images.length > 0">
                  <div class="group-header">
                    <div class="group-title">
                      <div class="group-icon" [innerHTML]="sanitizer.bypassSecurityTrustHtml(group.icon)"></div>
                      <h3>{{ group.label }}</h3>
                    </div>
                  </div>

                  <div class="masonry-grid">
                    <div *ngFor="let img of group.images" class="masonry-item" (click)="openImage(img)">
                      <img [src]="img" [alt]="img" loading="lazy">
                      <div class="item-overlay">
                        <div class="item-action">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><line x1="11" x1="8" x2="11" y2="14"/><line x1="8" x1="11" x2="14" y2="11"/></svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </ng-container>
            </div>
          </main>

          <aside class="secondary-content">
            <div class="sticky-sidebar">
              <section class="glass-card action-card">
                <h3>Aktionen</h3>
                <div class="action-list">
                  <button class="action-btn primary" (click)="generatePdf()">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x1="15" x2="12" y2="3"/></svg>
                    <span>PDF Export</span>
                  </button>
                  <button class="action-btn secondary">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    <span>Editieren</span>
                  </button>
                </div>
              </section>

              <section class="glass-card info-card">
                <h3>Details</h3>
                <div class="info-item" *ngIf="roomDetails()?.budget">
                  <span class="info-label">Materialbudget (geschätzt)</span>
                  <p class="info-value">{{ roomDetails()?.budget | number:'1.0-0':'de-DE' }} €</p>
                </div>
                <div class="info-divider" *ngIf="roomDetails()?.budget"></div>
                <div class="info-item">
                  <span class="info-label">Standard</span>
                  <p class="info-value">Herleitungspflicht nach GEMINI.md erfüllt.</p>
                </div>
              </section>
            </div>
          </aside>
        </div>
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
    .room-page { animation: fadeIn 0.4s ease-out; position: relative; }

    /* HERO SECTION */
    .room-hero {
      height: 60vh;
      min-height: 450px;
      margin: -2.5rem -2.5rem 0 -2.5rem;
      position: relative;
      overflow: hidden;
      background-color: #0f172a;
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

    .slider-input {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      opacity: 0;
      cursor: ew-resize;
      z-index: 15;
    }

    .slider-line {
      position: absolute;
      top: 0; bottom: 0;
      width: 1px;
      background: rgba(255,255,255,0.8);
      z-index: 12;
    }

    .slider-handle {
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      width: 40px; height: 40px;
      background: white;
      border-radius: 50%;
      display: flex;
      align-items: center; justify-content: center;
      box-shadow: 0 4px 15px rgba(0,0,0,0.3);
      color: #0f172a;
      z-index: 20;
    }

    .hero-overlay {
      position: absolute; bottom: 0; left: 0; right: 0; height: 100%;
      background: linear-gradient(to top, rgba(15, 23, 42, 0.9) 0%, rgba(15, 23, 42, 0.4) 40%, rgba(15, 23, 42, 0.1) 100%);
      z-index: 2;
    }

    /* HERO CONTENT */
    .hero-content-wrapper {
      position: absolute;
      bottom: 60px;
      left: 2.5rem;
      z-index: 10;
      pointer-events: none;
      color: white;
    }

    .minimal-breadcrumb {
      font-size: 0.9rem;
      font-weight: 500;
      color: white;
      opacity: 0.6;
      margin-bottom: 0.5rem;
    }
    .minimal-breadcrumb a { pointer-events: auto; color: inherit; text-decoration: none; border-bottom: 1px solid transparent; }
    .minimal-breadcrumb a:hover { border-bottom-color: currentColor; }

    .minimal-title {
      font-size: 5rem;
      font-weight: 800;
      line-height: 0.9;
      margin: 0 0 1.25rem 0;
      color: white;
      letter-spacing: -0.04em;
      text-shadow: 0 10px 30px rgba(0,0,0,0.3);
    }

    .hero-meta { display: flex; flex-direction: column; gap: 0.75rem; }
    .area-text { margin: 0; font-size: 1.25rem; font-weight: 600; color: white; opacity: 0.9; text-shadow: 0 2px 10px rgba(0,0,0,0.3); }
    .derivation-hint { font-size: 0.85em; font-style: italic; opacity: 0.6; font-weight: 400; }

    /* EXACT DASHBOARD STATUS STYLING */
    .badge { padding: 0.25rem 0; border-radius: 8px; font-size: 0.7rem; font-weight: 800; display: flex; align-items: center; gap: 0.5rem; text-transform: uppercase; letter-spacing: 0.08em; }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
    
    .status-active { color: #60a5fa; }
    .status-active .status-dot { background: #60a5fa; box-shadow: 0 0 10px #3b82f6; }
    .status-planned { color: #94a3b8; }
    .status-planned .status-dot { background: #94a3b8; }
    .status-onhold { color: #f87171; }
    .status-onhold .status-dot { background: #f87171; }
    .status-finished { color: #4ade80; }
    .status-finished .status-dot { background: #4ade80; box-shadow: 0 0 10px #22c55e; }

    /* CONTENT CONTAINER */
    .content-container {
      position: relative;
      z-index: 10;
      padding: 3rem 2.5rem 5rem 2.5rem;
    }

    /* MAIN LAYOUT */
    .main-layout { display: grid; grid-template-columns: 1fr 320px; gap: 4rem; }

    .documentation-section { padding: 3rem; margin-bottom: 4rem; border: none; background: var(--card-bg); }
    .card-header-accent { display: flex; align-items: center; gap: 0.8rem; margin-bottom: 2rem; opacity: 0.6; }
    .card-header-accent h2 { margin: 0; font-size: 1rem; text-transform: uppercase; letter-spacing: 0.1em; }

    .markdown-body { font-size: 1.15rem; line-height: 1.8; color: var(--text-color); opacity: 0.9; }
    :host ::ng-deep .markdown-body h2 { font-size: 1.3rem; margin: 3rem 0 1.5rem 0; color: var(--primary-color); border: none; }
    :host ::ng-deep .markdown-body p { margin-bottom: 1.5rem; }

    /* MEDIA GROUPS */
    .media-container { display: flex; flex-direction: column; gap: 5rem; }
    .group-header { margin-bottom: 2rem; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem; }
    .group-title { display: flex; align-items: center; gap: 0.75rem; }
    .group-icon { color: var(--primary-color); opacity: 0.7; }
    .group-title h3 { margin: 0; font-size: 1.1rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; opacity: 0.8; }

    .masonry-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
    .masonry-item { 
      position: relative; border-radius: 12px; overflow: hidden; cursor: pointer;
      background: var(--card-bg); border: 1px solid var(--border-color);
      aspect-ratio: 3/2;
    }
    .masonry-item img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
    .masonry-item:hover img { transform: scale(1.05); }
    
    .item-overlay { 
      position: absolute; top: 0; left: 0; right: 0; bottom: 0; 
      background: rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center;
      opacity: 0; transition: opacity 0.3s;
    }
    .masonry-item:hover .item-overlay { opacity: 1; }
    .item-action { color: white; background: var(--primary-color); width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }

    /* SIDEBAR */
    .sticky-sidebar { position: sticky; top: 100px; display: flex; flex-direction: column; gap: 2rem; }
    .action-card, .info-card { padding: 2rem; border: none; }
    .action-card h3, .info-card h3 { margin: 0 0 1.5rem 0; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em; opacity: 0.4; }
    
    .action-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .action-btn { 
      display: flex; align-items: center; gap: 1rem; width: 100%; padding: 0.8rem 1.2rem; 
      border-radius: 10px; border: none; font-weight: 700; cursor: pointer; transition: all 0.2s;
    }
    .action-btn.primary { background: var(--text-color); color: var(--bg-color); }
    .action-btn.secondary { background: transparent; color: var(--text-color); border: 1px solid var(--border-color); }
    .action-btn:hover { opacity: 0.8; transform: translateY(-1px); }

    .info-item { display: flex; flex-direction: column; gap: 0.4rem; }
    .info-label { font-size: 0.7rem; font-weight: 700; opacity: 0.5; }
    .info-value { font-size: 0.95rem; font-weight: 500; margin: 0; }
    .info-divider { height: 1px; background: var(--border-color); margin: 1.5rem 0; opacity: 0.5; }

    @media (max-width: 1200px) {
      .main-layout { grid-template-columns: 1fr; gap: 3rem; }
      .minimal-title { font-size: 4rem; }
    }

    @media (max-width: 768px) {
      .minimal-title { font-size: 3rem; }
      .hero-content-wrapper { left: 1.5rem; bottom: 40px; }
      .content-container { padding: 2rem 1.5rem 3rem 1.5rem; }
      .room-hero { height: 50vh; }
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `],
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

  private roomImagesMap: Record<string, string[]> = {
    'bad': [
      'assets/rooms/bad/medien/ist/vorher.png',
      'assets/rooms/bad/medien/inspiration/titel.png',
      'assets/rooms/bad/medien/ist/IMG_9974.jpg', 
      'assets/rooms/bad/medien/ist/IMG_9976.jpg', 
      'assets/rooms/bad/medien/material/fliesen2.jpg', 
      'assets/rooms/bad/medien/material/schrank.JPG',
      'assets/rooms/bad/medien/plan/grundriss.png',
      'assets/rooms/bad/medien/plan/grundriss_ausschnitt.png',
      'assets/rooms/bad/medien/inspiration/f9203bbf-e397-43e0-997a-3b0dceafdddd.JPG'
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
      'assets/rooms/wohnraum/medien/plan/grundriss.JPG',
      'assets/rooms/wohnraum/medien/plan/grundriss_gesamt.png',
    ],
    'kellerflur': [
      'assets/rooms/kellerflur/medien/ist/kellerflur_ansicht_eingang.jpg', 
      'assets/rooms/kellerflur/medien/ist/kellerflur_ansicht_flur_lang.jpg',
      'assets/rooms/kellerflur/medien/ist/kellerflur_wand_mit_kasten.jpg',
      'assets/rooms/kellerflur/medien/ist/kellerflur_treppe_seite.jpg',
      'assets/rooms/kellerflur/medien/ist/kellerflur_treppe_blick_unten.jpg',
      'assets/rooms/kellerflur/medien/ist/kellerflur_ansicht_schrank.jpg',
      'assets/rooms/kellerflur/medien/ist/kellerflur_fenster_detail.jpg',
      'assets/rooms/kellerflur/medien/plan/grundriss_keller.JPG',
      'assets/rooms/kellerflur/medien/plan/grundriss_detail.png',
      'assets/rooms/kellerflur/medien/inspiration/kellerflur_detail_2.jpg',
      'assets/rooms/kellerflur/medien/inspiration/kellerflur_detail_3.jpg',
      'assets/rooms/kellerflur/medien/inspiration/kellerflur_detail_4.jpg',
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

  generatePdf() {
    console.log('Generating PDF for', this.roomName());
    window.open(`assets/renovierungsplan.pdf`, '_blank');
  }
}
