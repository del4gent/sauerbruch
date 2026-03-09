import { Component, ViewEncapsulation, OnInit, OnDestroy } from '@angular/core';
import { StatusBadgeComponent } from './ui/status-badge/status-badge.component';
import { RoomCardComponent } from './ui/room-card/room-card.component';
import { StatCardComponent } from './ui/stat-card/stat-card.component';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import roomsData from '../../public/assets/data/rooms.json';

@Component({
  selector: 'app-nx-welcome',
  standalone: true,
  imports: [CommonModule, RouterModule, StatusBadgeComponent, RoomCardComponent, StatCardComponent],
  template: `
    <div class="dashboard">
      <header class="hero-header glass-card">
        <div class="hero-image" style="background-image: url('assets/plan/house_hero.jpg')"></div>
        <div class="hero-overlay"></div>
        <div class="hero-content">
          <h1 class="gradient-text">Projekt Sauerbruch 3</h1>
          
          <div class="stats-grid overlay-stats">
            <app-stat-card 
              label="Gesamtfortschritt" 
              value="24%" 
              [progress]="24" 
              link="/details/progress">
            </app-stat-card>

            <app-stat-card 
              label="Gesamtfläche" 
              value="178,05 m²" 
              link="/details/area">
            </app-stat-card>

            <app-stat-card 
              label="Materialbudget" 
              value="50.320 €" 
              link="/details/budget">
            </app-stat-card>
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

          <app-room-card *ngFor="let room of rooms" [room]="room" [images]="getRoomImages(room.id)" [currentImageIndex]="currentImageIndices[room.id]"></app-room-card>
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

    .section-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2.5rem; }
    .section-header h2 { font-size: 2rem; margin: 0; font-weight: 800; letter-spacing: -0.02em; }
    
    .filter-chip { 
      padding: 0.5rem 1.25rem; border-radius: 50px; font-size: 0.85rem; font-weight: 700;
      background: var(--card-bg); border: 1px solid var(--border-color); cursor: pointer;
    }
    .filter-chip.active { background: var(--text-color); color: var(--bg-color); border-color: var(--text-color); }

    .room-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 2.5rem; }

    @media (max-width: 1024px) {
      .hero-header { height: 450px; padding: 2.5rem; margin-bottom: 3rem; }
      .hero-content h1 { font-size: 4rem; }
      .room-grid { grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem; }
    }

    @media (max-width: 768px) {
      .hero-header { height: 350px; padding: 1.25rem; border-radius: 0; margin: -1.25rem -1.25rem 2rem -1.25rem; border-left: none; border-right: none; }
      .hero-content h1 { font-size: 2.75rem; margin-bottom: 1.5rem; }
      .room-grid { 
        grid-template-columns: 1fr; 
        gap: 0; 
        margin: 0 -1.25rem; 
      }
      .section-header { padding: 0 1.25rem; margin-bottom: 1.5rem; }
      .stat-value { font-size: 1.75rem; }
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

  
}
