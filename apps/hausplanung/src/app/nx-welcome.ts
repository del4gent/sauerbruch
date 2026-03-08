import { Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-nx-welcome',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard">
      <header class="main-header">
        <h1 class="gradient-text">Projekt Dashboard</h1>
        <p class="subtitle">Sauerbruchstraße 3 — Hausplanung & Renovierung</p>
      </header>

      <div class="stats-grid">
        <div class="glass-card stat-item">
          <span class="stat-label">Gesamtfortschritt</span>
          <div class="progress-container">
            <div class="progress-bar" style="width: 20%"></div>
          </div>
          <span class="stat-value">20%</span>
        </div>

        <div class="glass-card stat-item">
          <span class="stat-label">Gesamtfläche</span>
          <span class="stat-value">61,24 m²</span>
          <span class="stat-derivation">(Derivation: PDF Report Revision 2.2)</span>
        </div>

        <div class="glass-card stat-item">
          <span class="stat-label">Geschätztes Budget</span>
          <span class="stat-value">29.013 €</span>
          <span class="stat-derivation">(Summe aller Raumschätzungen)</span>
        </div>
      </div>

      <section class="rooms-section">
        <div class="section-header">
          <h2>Aktuelle Räume</h2>
          <button class="btn-primary">Alle Details</button>
        </div>
        
        <div class="room-grid">
          <div class="glass-card room-card" [routerLink]="['/room', 'bad']">
            <div class="room-icon">🚿</div>
            <div class="room-info">
              <h3>Badezimmer</h3>
              <p>6,64 m² (laut Grundriss)</p>
              <div class="badge status-active">🏗️ In Arbeit</div>
            </div>
          </div>

          <div class="glass-card room-card" [routerLink]="['/room', 'wc']">
            <div class="room-icon">🚽</div>
            <div class="room-info">
              <h3>Gästebad</h3>
              <p>2,86 m² (laut Grundriss)</p>
              <div class="badge status-planned">⏳ In Planung</div>
            </div>
          </div>

          <div class="glass-card room-card" [routerLink]="['/room', 'wohnraum']">
            <div class="room-icon">🛋️</div>
            <div class="room-info">
              <h3>Wohnraum</h3>
              <p>20,02 m² (laut Grundriss)</p>
              <div class="badge status-planned">⏳ In Planung</div>
            </div>
          </div>

          <div class="glass-card room-card" [routerLink]="['/room', 'diele']">
            <div class="room-icon">🧣</div>
            <div class="room-info">
              <h3>Diele</h3>
              <p>12,25 m² (laut Grundriss)</p>
              <div class="badge status-planned">⏳ In Planung</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .main-header { margin-bottom: 3.5rem; }
    .main-header h1 { font-size: 3.5rem; margin: 0; margin-bottom: 0.5rem; }
    .subtitle { font-size: 1.1rem; opacity: 0.6; font-weight: 500; }

    .stats-grid { 
      display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); 
      gap: 2rem; margin-bottom: 4rem; 
    }
    .stat-item { padding: 2.5rem; display: flex; flex-direction: column; }
    .stat-label { font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.6; font-weight: 800; margin-bottom: 1rem; }
    .stat-value { font-size: 2.2rem; font-weight: 800; }
    .stat-derivation { font-size: 0.8rem; opacity: 0.4; margin-top: 0.5rem; font-style: italic; }

    .progress-container { background: rgba(255, 255, 255, 0.05); height: 8px; border-radius: 4px; margin: 1rem 0; overflow: hidden; }
    .progress-bar { background: var(--primary-color); height: 100%; border-radius: 4px; box-shadow: 0 0 15px rgba(59, 130, 246, 0.5); }

    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .room-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; }
    
    .room-card { padding: 1.5rem; display: flex; gap: 1.5rem; align-items: center; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
    .room-card:hover { transform: translateY(-5px); border-color: var(--primary-color); }
    
    .room-icon { font-size: 2.5rem; background: rgba(255,255,255,0.03); padding: 1rem; border-radius: 16px; }
    .room-info h3 { margin: 0; font-size: 1.25rem; }
    .room-info p { margin: 0.25rem 0 0.75rem 0; opacity: 0.5; font-size: 0.9rem; }

    .badge { padding: 0.4rem 0.8rem; border-radius: 10px; font-size: 0.75rem; font-weight: 700; display: inline-block; }
    .status-active { background: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3); }
    .status-planned { background: rgba(148, 163, 184, 0.1); color: #94a3b8; border: 1px solid rgba(148, 163, 184, 0.2); }

    .btn-primary { 
      background: var(--primary-color); color: white; border: none; padding: 0.75rem 1.5rem; 
      border-radius: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s;
    }
    .btn-primary:hover { transform: scale(1.05); box-shadow: 0 10px 20px -5px rgba(59, 130, 246, 0.4); }
  `],
  encapsulation: ViewEncapsulation.None,
})
export class NxWelcomeComponent {}
