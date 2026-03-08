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
              <span class="stat-label">Fortschritt</span>
              <div class="progress-container">
                <div class="progress-bar" style="width: 18%"></div>
              </div>
              <span class="stat-value">18%</span>
            </div>

            <div class="stat-item transparent" routerLink="/details/area">
              <span class="stat-label">Gesamtfläche</span>
              <span class="stat-value">178,05 m²</span>
            </div>

            <div class="stat-item transparent" routerLink="/details/budget">
              <span class="stat-label">Budget</span>
              <span class="stat-value">27.920 €</span>
            </div>
          </div>
        </div>
      </header>

      <section class="rooms-section">
        <div class="section-header">
          <h2>Räume im Umbau</h2>
        </div>
        
        <div class="room-grid">

          <div *ngFor="let room of rooms" class="glass-card room-card" [routerLink]="['/room', room.id]">
            <div class="room-preview-container">
              <div *ngFor="let img of getRoomImages(room.id); let i = index" 
                   class="room-preview" 
                   [class.active]="i === currentImageIndices[room.id]"
                   [style.backgroundImage]="'url(' + img + ')'">
              </div>
            </div>
            <div class="room-overlay"></div>
            <div class="room-content-wrapper">
              <div class="room-info">
                <h3>{{ room.name }}</h3>
                <p>{{ room.area }} m² ({{ room.area_derivation }})</p>
                <div class="badge" [ngClass]="{
                  'status-active': room.status === 'Angefangen' || room.status === 'In Arbeit',
                  'status-planned': room.status === 'In Planung',
                  'status-onhold': room.status === 'On hold'
                }">
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
    .hero-header { 
      position: relative; 
      height: 520px; 
      border-radius: 24px; 
      overflow: hidden; 
      margin-bottom: 3rem;
      display: flex;
      align-items: flex-end;
      padding: 3rem;
      border: 1px solid var(--border-color);
    }
    .hero-image { 
      position: absolute; top: 0; left: 0; right: 0; bottom: 0; 
      background-size: cover; background-position: center 40%;
      transition: transform 0.5s ease;
    }
    .hero-header:hover .hero-image { transform: scale(1.02); }
    .hero-overlay { 
      position: absolute; top: 0; left: 0; right: 0; bottom: 0; 
      background: linear-gradient(to top, rgba(2, 6, 23, 0.98) 0%, rgba(2, 6, 23, 0.6) 40%, rgba(2, 6, 23, 0.2) 100%);
    }
    .hero-content { position: relative; z-index: 1; width: 100%; display: flex; flex-direction: column; height: 100%; justify-content: flex-end; }
    .hero-content h1 { 
      font-size: 5rem; 
      margin: 0 0 auto 0; 
      padding-top: 2rem;
      line-height: 1; 
      font-weight: 900;
      letter-spacing: -0.04em;
      background: linear-gradient(135deg, #60a5fa 0%, #a855f7 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      text-shadow: 0 10px 30px rgba(0,0,0,0.3);
    }

    .stats-grid { 
      display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); 
      gap: 1.5rem; 
      width: 100%;
    }
    .stat-item { 
      padding: 1.5rem; 
      display: flex; 
      flex-direction: column; 
      cursor: pointer; 
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border-radius: 20px;
    }
    .stat-item.transparent {
      background: rgba(255, 255, 255, 0.015);
      border: 1px solid rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(12px) saturate(160%);
    }
    .stat-item:hover { 
      transform: translateY(-8px); 
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.3);
      box-shadow: 0 20px 40px -12px rgba(0,0,0,0.5);
    }
    .stat-label { 
      font-size: 0.65rem; 
      text-transform: uppercase; 
      letter-spacing: 0.15em; 
      color: white; 
      font-weight: 800; 
      margin-bottom: 1rem; 
      opacity: 0.6;
    }
    .stat-value { 
      font-size: 1.75rem; 
      font-weight: 800; 
      color: white; 
      line-height: 1.1;
      letter-spacing: -0.01em;
    }

    .progress-container { background: rgba(255, 255, 255, 0.1); height: 5px; border-radius: 3px; margin: 0.75rem 0 1rem 0; overflow: hidden; }
    .progress-bar { 
      background: linear-gradient(90deg, #60a5fa, #a855f7); 
      height: 100%; 
      border-radius: 3px; 
      box-shadow: 0 0 15px rgba(96, 165, 250, 0.5);
    }

    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .room-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(380px, 1fr)); gap: 2rem; }
    
    .room-card { 
      min-height: 180px;
      display: flex; 
      cursor: pointer; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative; overflow: hidden;
      border-radius: 20px;
      padding: 0;
      background: #1e293b;
      border: 1px solid rgba(255,255,255,0.1);
    }
    .room-card:hover { transform: translateY(-8px) scale(1.02); border-color: var(--primary-color); box-shadow: 0 20px 40px -10px rgba(0,0,0,0.5); }
    
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
      transition: opacity 2s ease-in-out, transform 8s ease-in-out;
      transform: scale(1);
    }

    .room-preview.active {
      opacity: 0.8;
      transform: scale(1.1);
    }

    .room-card:hover .room-preview.active {
      opacity: 1.0;
    }

    .room-overlay {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      background: linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.4) 60%, rgba(0, 0, 0, 0.2) 100%);
      z-index: 1;
    }

    .room-content-wrapper {
      position: relative;
      z-index: 2;
      display: flex;
      gap: 1.25rem;
      align-items: center;
      padding: 1.25rem;
      width: 100%;
      color: white;
    }

    .room-icon { 
      font-size: 1.2rem; 
      background: rgba(255,255,255,0.15); 
      backdrop-filter: blur(8px);
      width: 44px; height: 44px;
      display: flex; align-items: center; justify-content: center;
      border-radius: 12px; 
      flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      border: 1px solid rgba(255,255,255,0.1);
    }
    .room-info h3 { margin: 0; font-size: 1.4rem; font-weight: 800; text-shadow: 0 2px 10px rgba(0,0,0,0.9); color: white; letter-spacing: -0.01em; }
    .room-info p { margin: 0.1rem 0 0.5rem 0; opacity: 0.6; font-size: 0.75rem; text-shadow: 0 1px 4px rgba(0,0,0,0.8); color: white; font-weight: 500; }

    .badge { padding: 0.25rem 0; border-radius: 8px; font-size: 0.65rem; font-weight: 800; display: flex; align-items: center; gap: 0.4rem; text-transform: uppercase; letter-spacing: 0.03em; }
    .status-dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; }
    
    .status-active { background: none; color: #4ade80; border: none; }
    .status-active .status-dot { background: #4ade80; box-shadow: 0 0 8px #22c55e; }
    
    .status-planned { background: none; color: #fde047; border: none; }
    .status-planned .status-dot { background: #eab308; }

    .status-onhold { background: none; color: #f87171; border: none; }
    .status-onhold .status-dot { background: #ef4444; }

    .btn-primary { 
      background: var(--primary-color); color: white; border: none; padding: 0.75rem 1.5rem; 
      border-radius: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s;
    }
    .btn-primary:hover { transform: scale(1.05); box-shadow: 0 10px 20px -5px rgba(59, 130, 246, 0.4); }

    @media (max-width: 1024px) {
      .hero-header { min-height: 400px; height: auto; padding: 2rem; margin-bottom: 2rem; }
      .hero-content h1 { font-size: 3.5rem; margin-bottom: 2.5rem; }
      .stats-grid { gap: 1rem; }
      .room-grid { grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; }
    }

    @media (max-width: 768px) {
      .hero-header { min-height: 360px; height: auto; padding: 2rem 1.5rem; border-radius: 20px; }
      .hero-content h1 { font-size: 2.5rem; margin-bottom: 2rem; }
      .stats-grid { grid-template-columns: 1fr; gap: 0.75rem; }
      .stat-item { padding: 1rem 1.25rem; }
      .stat-value { font-size: 1.5rem; }
      .section-header h2 { font-size: 1.5rem; }
      .room-grid { grid-template-columns: 1fr; }
      .room-card { min-height: 140px; }
    }

    @media (max-width: 480px) {
      .hero-header { min-height: 320px; padding: 1.5rem 1.25rem; }
      .hero-content h1 { font-size: 2rem; margin-bottom: 1.5rem; }
      .stat-item { padding: 0.85rem 1rem; border-radius: 14px; }
      .stat-value { font-size: 1.25rem; }
      .stat-label { font-size: 0.55rem; margin-bottom: 0.5rem; }
    }
  `],
  encapsulation: ViewEncapsulation.None,
})
export class NxWelcomeComponent implements OnInit, OnDestroy {
  rooms = roomsData.filter(r => ['In Planung', 'Angefangen', 'In Arbeit'].includes(r.status));
  currentImageIndices: Record<string, number> = {};
  private intervalId: any;

  // Dynamic image map populated with inspiration images
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
    // Initialize indices
    this.rooms.forEach(room => {
      this.currentImageIndices[room.id] = 0;
    });

    // Start slideshow interval
    this.intervalId = setInterval(() => {
      this.rooms.forEach(room => {
        const imgs = this.getRoomImages(room.id);
        if (imgs.length > 1) {
          this.currentImageIndices[room.id] = (this.currentImageIndices[room.id] + 1) % imgs.length;
        }
      });
    }, 5000); // Switch every 5 seconds
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  getRoomEmoji(roomId: string): string {
    const emojis: Record<string, string> = {
      'flur': '🚪',
      'wohnraum': '🛋️',
      'essraum': '🍽️',
      'kueche': '🍳',
      'bad': '🚿',
      'wc': '🚽',
      'schlafzimmer': '🛏️',
      'kinderzimmer': '🧸',
      'zimmer': '💻',
      'flur_privat': '🗝️',
      'garderobe': '🧥',
      'garage': '🚗',
      'kellerflur': '📦'
    };
    return emojis[roomId] || '🏠';
  }

  getRoomImages(roomId: string): string[] {
    return this.roomImagesMap[roomId] || [];
  }
}
