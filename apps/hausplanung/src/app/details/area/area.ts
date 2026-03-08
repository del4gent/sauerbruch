import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FloorPlanComponent } from '../../floor-plan/floor-plan';
import roomsData from '../../../../public/assets/data/rooms.json';

@Component({
  selector: 'app-area',
  standalone: true,
  imports: [CommonModule, RouterModule, FloorPlanComponent],
  template: `
    <div class="details-container">
      <header class="details-header">
        <a routerLink="/" class="btn-back">← Dashboard</a>
        <h1 class="gradient-text">Flächen & Grundriss</h1>
        <p class="subtitle">Interaktive Übersicht und Herleitung der m²-Angaben</p>
      </header>

      <div class="floorplan-section">
        <app-floor-plan (roomSelected)="onRoomSelected($event)"></app-floor-plan>
      </div>

      <div class="glass-card table-card">
        <div class="table-header">
          <h3>Detaillierte Flächenaufstellung</h3>
        </div>
        <table class="details-table">
          <thead>
            <tr>
              <th>Raum</th>
              <th>Fläche</th>
              <th>Herleitung / Quelle</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let room of rooms" class="clickable-row" (click)="onRoomSelected(room.id)">
              <td data-label="Raum">{{ room.name }}</td>
              <td data-label="Fläche" class="font-mono">{{ room.area }} m²</td>
              <td data-label="Quelle" class="opacity-60 italic">{{ room.area_derivation }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td data-label="Zusammenfassung">Gesamtfläche Netto</td>
              <td colspan="2" data-label="Summe" class="font-mono">{{ totalArea() }} m²</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .details-container { max-width: 1200px; margin: 0 auto; padding-bottom: 5rem; }
    .details-header { margin-bottom: 3rem; }
    .btn-back { color: var(--primary-color); text-decoration: none; font-weight: 700; margin-bottom: 1rem; display: inline-block; }
    
    .floorplan-section { margin-bottom: 3rem; }

    .table-card { padding: 0; overflow: hidden; }
    .table-header { padding: 2rem 2rem 1rem 2rem; border-bottom: 1px solid var(--border-color); }
    .table-header h3 { margin: 0; opacity: 0.8; font-size: 1.25rem; }

    .details-table { width: 100%; border-collapse: collapse; }
    .details-table th, .details-table td { padding: 1.25rem 2rem; border-bottom: 1px solid var(--border-color); text-align: left; }
    .details-table th { background: rgba(255,255,255,0.05); font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.6; }
    
    .clickable-row { cursor: pointer; transition: background 0.2s; }
    .clickable-row:hover { background: rgba(255,255,255,0.03); }

    .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-weight: 700; }
    .opacity-60 { opacity: 0.6; }
    .italic { font-style: italic; }
    
    .total-row { background: rgba(16, 185, 129, 0.1); font-size: 1.25rem; font-weight: 800; }
    .total-row td { border-bottom: none; }

    @media (max-width: 768px) {
      .details-header { margin-bottom: 2rem; }
      .details-table th, .details-table td { padding: 1rem; }
    }
  `]
})
export class AreaComponent {
  rooms = roomsData;
  totalArea = signal(roomsData.reduce((acc, r) => acc + r.area, 0).toFixed(2));

  constructor(private router: Router) {}

  onRoomSelected(roomId: string) {
    this.router.navigate(['/room', roomId]);
  }
}
