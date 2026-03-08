import { Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-nx-welcome',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard">
      <header>
        <h1>Projekt Übersicht</h1>
        <p>Sauerbruchstraße 3 - Renovierungsplanung</p>
      </header>

      <div class="grid">
        <div class="card">
          <h3>Status</h3>
          <div class="status-badge progress">🏗️ In Arbeit</div>
          <p>Aktuell: Bad-Sanierung</p>
        </div>

        <div class="card">
          <h3>Fläche Gesamt</h3>
          <p class="value">61,24 m²</p>
          <p class="derivation">(Derivation: 17,04 + 3,02 + 6,64 + 20,02 + 14,52)</p>
        </div>

        <div class="card">
          <h3>Budget</h3>
          <p class="value">29.013 €</p>
          <p class="derivation">(Geschätzte Gesamtkosten)</p>
        </div>
      </div>

      <section class="rooms-overview">
        <h2>Räume</h2>
        <div class="room-list">
          <div class="room-item">
            <span>🚿 Bad</span>
            <span class="badge progress">🏗️ In Arbeit</span>
          </div>
          <div class="room-item">
            <span>🚽 Gästebad</span>
            <span class="badge planned">⏳ Geplant</span>
          </div>
          <div class="room-item">
            <span>🧣 Flur</span>
            <span class="badge planned">⏳ Geplant</span>
          </div>
          <div class="room-item">
            <span>🛋️ Wohnzimmer</span>
            <span class="badge planned">⏳ Geplant</span>
          </div>
          <div class="room-item">
            <span>📦 Kellerflur</span>
            <span class="badge planned">⏳ Geplant</span>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .dashboard header { margin-bottom: 2rem; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 3rem; }
    .card { background: var(--card-bg); padding: 1.5rem; border-radius: 12px; border: 1px solid var(--border-color); }
    .card h3 { margin-top: 0; font-size: 0.9rem; opacity: 0.7; }
    .value { font-size: 1.5rem; font-weight: 700; margin: 0.5rem 0; }
    .derivation { font-size: 0.8rem; opacity: 0.5; font-style: italic; }
    
    .status-badge, .badge { padding: 0.25rem 0.75rem; border-radius: 99px; font-size: 0.8rem; font-weight: 600; }
    .badge.progress, .status-badge.progress { background: rgba(59, 130, 246, 0.1); color: var(--primary-color); border: 1px solid var(--primary-color); }
    .badge.planned { background: rgba(148, 163, 184, 0.1); color: #94a3b8; border: 1px solid #94a3b8; }
    
    .room-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .room-item { 
      display: flex; justify-content: space-between; align-items: center; 
      padding: 1rem; background: var(--card-bg); border-radius: 8px; border: 1px solid var(--border-color);
    }
  `],
  encapsulation: ViewEncapsulation.None,
})
export class NxWelcomeComponent {}
