import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import roomsData from '../../../../public/assets/data/rooms.json';

@Component({
  selector: 'app-area',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="details-container">
      <header class="details-header">
        <a routerLink="/" class="btn-back">← Dashboard</a>
        <h1 class="gradient-text">Flächen & Grundriss</h1>
        <p class="subtitle">Herleitung der m²-Angaben laut Bauplan</p>
      </header>

      <div class="glass-card floorplan-card">
        <h3>Gesamtgrundriss</h3>
        <img src="assets/plan/grundriss.JPG" alt="Grundriss" class="floorplan-img">
      </div>

      <div class="glass-card table-card">
        <table class="details-table">
          <thead>
            <tr>
              <th>Raum</th>
              <th>Fläche</th>
              <th>Herleitung / Quelle</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let room of rooms">
              <td>{{ room.name }}</td>
              <td class="font-mono">{{ room.area }} m²</td>
              <td class="opacity-60 italic">{{ room.area_derivation }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td>Gesamtfläche Netto</td>
              <td colspan="2" class="font-mono">{{ totalArea() }} m²</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .details-container { max-width: 1000px; margin: 0 auto; }
    .details-header { margin-bottom: 3rem; }
    .btn-back { color: var(--primary-color); text-decoration: none; font-weight: 700; margin-bottom: 1rem; display: inline-block; }
    
    .floorplan-card { margin-bottom: 2rem; padding: 2rem; }
    .floorplan-img { width: 100%; border-radius: 12px; border: 1px solid var(--border-color); }
    .floorplan-card h3 { margin-top: 0; margin-bottom: 1.5rem; opacity: 0.7; }

    .table-card { padding: 0; overflow: hidden; }
    .details-table { width: 100%; border-collapse: collapse; }
    .details-table th, .details-table td { padding: 1.25rem 2rem; border-bottom: 1px solid var(--border-color); text-align: left; }
    .details-table th { background: rgba(255,255,255,0.05); font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.6; }
    
    .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-weight: 700; }
    .opacity-60 { opacity: 0.6; }
    .italic { font-style: italic; }
    
    .total-row { background: rgba(16, 185, 129, 0.1); font-size: 1.25rem; font-weight: 800; }
    .total-row td { border-bottom: none; }
  `]
})
export class AreaComponent {
  rooms = roomsData;
  totalArea = signal(roomsData.reduce((acc, r) => acc + r.area, 0).toFixed(2));
}
