import { Component, ViewEncapsulation, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import roomsData from '../../public/assets/data/rooms.json';

@Component({
  selector: 'app-nx-welcome',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard">
      <header class="hero-header glass-card">
        <div class="hero-image" style="background-image: url('assets/plan/house_hero.jpg')"></div>
        <div class="hero-overlay"></div>
        <div class="hero-content">
          <h1 class="gradient-text">Projekt Sauerbruch 3</h1>
          
          <div class="stats-grid overlay-stats">
            <div class="stat-item transparent" routerLink="/details/progress">
              <span class="stat-label">Gesamtfortschritt</span>
              <div class="progress-container">
                <div class="progress-bar" style="width: 24%"></div>
              </div>
              <span class="stat-value">24%</span>
            </div>

            <div class="stat-item transparent" routerLink="/details/area">
              <span class="stat-label">Gesamtfläche</span>
              <span class="stat-value">178,05 m²</span>
            </div>

            <div class="stat-item transparent" routerLink="/details/budget">
              <span class="stat-label">Materialbudget</span>
              <span class="stat-value">50.320 €</span>
            </div>
          </div>
        </div>
      </header>

      <section class="rooms-section">
        <div class="section-header">
          <h2>Raumplanung</h2>
          <div class="view-filters">
            <span class="filter-chip active">Alle Räume</span>
          </div>
        </div>
        
        <div class="room-grid">

          <div *ngFor="let room of rooms" class="glass-card room-card" [routerLink]="['/room', room.id]">
            <div class="room-preview-container">
              <div *ngFor="let img of getRoomImages(room.id); let i = index" 
                   class="room-preview" 
                   [class.active]="i === currentImageIndices[room.id]"
                   [style.backgroundImage]="'url(' + img + ')'">
              </div>
              <div class="no-preview" *ngIf="getRoomImages(room.id).length === 0">
                <span>Kein Vorschaubild</span>
              </div>
            </div>
            <div class="room-overlay"></div>
            <div class="room-content-wrapper">
              <div class="room-info">
                <h3>{{ room.name }}</h3>
                <p>{{ room.area }} m² <span class="derivation-hint">({{ room.area_derivation }})</span></p>
                <div class="badge" [ngClass]="getStatusClass(room.status)">
                  <span class="status-dot"></span>
                  {{ room.status }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .dashboard {
      width: 100%;
      overflow-x: hidden;
      max-width: 100vw;
      padding-bottom: 5rem;
    }

    .hero-header { 
      position: relative; 
      height: 520px; 
      border-radius: 30px; 
      overflow: hidden; 
      margin-bottom: 4rem;
      display: flex;
      align-items: flex-end;
      padding: 3.5rem;
      border: 1px solid var(--border-color);
    }
    .hero-image { 
      position: absolute; top: 0; left: 0; right: 0; bottom: 0; 
      background-size: cover; background-position: center 40%;
      transition: transform 0.8s ease;
    }
    .hero-header:hover .hero-image { transform: scale(1.03); }
    .hero-overlay { 
      position: absolute; top: 0; left: 0; right: 0; bottom: 0; 
      background: linear-gradient(to top, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.4) 50%, rgba(15, 23, 42, 0.1) 100%);
    }
    .hero-content { position: relative; z-index: 1; width: 100%; display: flex; flex-direction: column; height: 100%; justify-content: flex-end; }
    .hero-content h1 { 
      font-size: 5.5rem; 
      margin: 0 0 auto 0; 
      padding-top: 2rem;
      line-height: 0.9; 
      font-weight: 900;
      letter-spacing: -0.05em;
      background: linear-gradient(135deg, #fff 0%, #94a3b8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .stats-grid { 
      display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); 
      gap: 2rem; 
      width: 100%;
    }
    .stat-item { 
      padding: 1.75rem; 
      display: flex; 
      flex-direction: column; 
      cursor: pointer; 
      transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      border-radius: 24px;
    }
    .stat-item.transparent {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(12px);
    }
    .stat-item:hover { 
      transform: translateY(-10px); 
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.2);
    }
    .stat-label { 
      font-size: 0.7rem; 
      text-transform: uppercase; 
      letter-spacing: 0.15em; 
      color: white; 
      font-weight: 800; 
      margin-bottom: 1.25rem; 
      opacity: 0.5;
    }
    .stat-value { 
      font-size: 2.25rem; 
      font-weight: 800; 
      color: white; 
      line-height: 1;
      letter-spacing: -0.02em;
    }

    .progress-container { background: rgba(255, 255, 255, 0.1); height: 6px; border-radius: 3px; margin: 0.5rem 0 1.25rem 0; overflow: hidden; }
    .progress-bar { 
      background: #fff; 
      height: 100%; 
      border-radius: 3px; 
    }

    .section-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2.5rem; }
    .section-header h2 { font-size: 2rem; margin: 0; font-weight: 800; letter-spacing: -0.02em; }
    
    .filter-chip { 
      padding: 0.5rem 1.25rem; border-radius: 50px; font-size: 0.85rem; font-weight: 700;
      background: var(--card-bg); border: 1px solid var(--border-color); cursor: pointer;
    }
    .filter-chip.active { background: var(--text-color); color: var(--bg-color); border-color: var(--text-color); }

    .room-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 2.5rem; }
    
    .room-card { 
      aspect-ratio: 16/10;
      display: flex; 
      cursor: pointer; transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
      position: relative; overflow: hidden;
      border-radius: 24px;
      padding: 0;
      background: #0f172a;
      border: 1px solid var(--border-color);
    }
    .room-card:hover { transform: translateY(-8px); border-color: rgba(255,255,255,0.3); }
    
    .room-preview-container {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      z-index: 0;
    }

    .room-preview {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      background-size: cover;
      background-position: center;
      opacity: 0;
      z-index: 0;
      pointer-events: none;
      transition: opacity 1.5s ease-in-out, transform 6s ease-in-out;
      transform: scale(1);
    }

    .room-preview.active {
      opacity: 0.6;
      transform: scale(1.08);
    }

    .room-card:hover .room-preview.active {
      opacity: 0.8;
    }

    .no-preview {
      display: flex; align-items: center; justify-content: center; height: 100%;
      background: #1e293b; color: rgba(255,255,255,0.2); font-size: 0.8rem; font-weight: 600;
    }

    .room-overlay {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      background: linear-gradient(to top, rgba(15, 23, 42, 0.9) 0%, rgba(15, 23, 42, 0.2) 60%);
      z-index: 1;
    }

    .room-content-wrapper {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      padding: 2rem;
      width: 100%;
      color: white;
    }

    .room-info h3 { margin: 0; font-size: 1.75rem; font-weight: 800; color: white; letter-spacing: -0.02em; }
    .room-info p { margin: 0.4rem 0 1rem 0; opacity: 0.5; font-size: 0.9rem; color: white; font-weight: 500; }
    .derivation-hint { font-size: 0.8em; font-style: italic; opacity: 0.7; }

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

    @media (max-width: 1024px) {
      .hero-header { height: 450px; padding: 2.5rem; margin-bottom: 3rem; }
      .hero-content h1 { font-size: 4rem; }
      .room-grid { grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem; }
    }

    @media (max-width: 768px) {
      .hero-header { height: 400px; padding: 2rem; border-radius: 24px; }
      .hero-content h1 { font-size: 3rem; }
      .stat-value { font-size: 1.75rem; }
      .room-grid { grid-template-columns: 1fr; }
    }
  `],
  encapsulation: ViewEncapsulation.None,
})
export class NxWelcomeComponent implements OnInit, OnDestroy {
  rooms = roomsData;
  currentImageIndices: Record<string, number> = {};
  private intervalId: any;

  private roomImagesMap: Record<string, string[]> = {
    'bad': [
      'assets/rooms/bad/medien/inspiration/titel.png',
      'assets/rooms/bad/medien/inspiration/f9203bbf-e397-43e0-997a-3b0dceafdddd.JPG'
    ],
    'wc': [
      'assets/rooms/wc/medien/inspiration/titel.jpg'
    ],
    'flur': [
      'assets/rooms/flur/medien/inspiration/flur_fenster_regenbogen.png',
      'assets/rooms/flur/medien/inspiration/kamin_farbiger_teppich.jpg',
      'assets/rooms/flur/medien/inspiration/kamin_clean_look.jpg'
    ],
    'wohnraum': [
      'assets/rooms/wohnraum/medien/ist/wohnzimmer_1.jpeg',
      'assets/rooms/wohnraum/medien/ist/wohnzimmer_2.jpeg',
      'assets/rooms/wohnraum/medien/ist/wohnzimmer_3.jpeg'
    ],
    'kellerflur': [
      'assets/rooms/kellerflur/medien/inspiration/kellerflur_detail_2.jpg',
      'assets/rooms/kellerflur/medien/inspiration/kellerflur_detail_3.jpg',
      'assets/rooms/kellerflur/medien/inspiration/kellerflur_detail_4.jpg'
    ],
    'keller_buero': [
      'assets/rooms/keller_buero/medien/inspiration/soll.png',
      'assets/rooms/keller_buero/medien/inspiration/IMG_0029.png',
      'assets/rooms/keller_buero/medien/inspiration/IMG_0031.png'
    ]
  };

  ngOnInit() {
    this.rooms.forEach(room => {
      this.currentImageIndices[room.id] = 0;
    });

    this.intervalId = setInterval(() => {
      this.rooms.forEach(room => {
        const imgs = this.getRoomImages(room.id);
        if (imgs.length > 1) {
          this.currentImageIndices[room.id] = (this.currentImageIndices[room.id] + 1) % imgs.length;
        }
      });
    }, 6000);
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  getRoomImages(roomId: string): string[] {
    return this.roomImagesMap[roomId] || [];
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
}
