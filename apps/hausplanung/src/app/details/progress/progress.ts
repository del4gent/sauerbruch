import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { StatusBadgeComponent } from '../../ui/status-badge/status-badge.component';

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [CommonModule, RouterModule, StatusBadgeComponent],
  template: `
    <div class="details-container">
      <header class="details-header">
        <a routerLink="/" class="btn-back">← Dashboard</a>
        <h1 class="gradient-text">Fortschritt Herleitung</h1>
        <p class="subtitle">Übersicht der erreichten Meilensteine</p>
      </header>

      <div class="glass-card table-card">
        <table class="details-table">
          <thead>
            <tr>
              <th>Meilenstein</th>
              <th class="text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let m of milestones">
              <td data-label="Meilenstein">{{ m.name }}</td>
              <td data-label="Status" class="text-right">
                <app-status-badge 
                  [label]="m.done ? 'Erledigt' : 'Offen'" 
                  [variant]="m.done ? 'done' : 'pending'"
                  [showDot]="false">
                </app-status-badge>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td data-label="Zusammenfassung">Gesamtfortschritt</td>
              <td data-label="Prozent" class="text-right font-mono">{{ calculateProgress() }}%</td>
            </tr>
          </tfoot>

        </table>
      </div>

      <div class="glass-card info-box">
        <h3>💡 Info zur Berechnung</h3>
        <p>Der Fortschritt berechnet sich aus dem Verhältnis der erledigten zu den geplanten Meilensteinen ({{ doneCount() }}/{{ milestones.length }}).</p>
      </div>
    </div>
  `,
  styles: [`
    .details-container { max-width: 900px; margin: 0 auto; padding: 2rem; }
    .details-header { margin-bottom: 3rem; }
    .btn-back { color: var(--primary-color); text-decoration: none; font-weight: 700; margin-bottom: 1rem; display: inline-block; }
    
    @media (max-width: 768px) {
      .details-container { padding: 1.25rem; }
      .details-header { margin-bottom: 2rem; }
      .info-box { padding: 1.25rem; }
    }

    .table-card { padding: 0; overflow: hidden; }
    
    .total-row { background: rgba(59, 130, 246, 0.1); }

    .info-box { margin-top: 2rem; padding: 2rem; }
    .info-box h3 { margin-top: 0; color: var(--primary-color); }
    .info-box p { margin-bottom: 0; opacity: 0.7; }
  `]
})
export class ProgressComponent {
  milestones = [
    { name: 'Datenaufnahme & Maße (m²)', done: true },
    { name: 'Erstellung Leistungsverzeichnis', done: true },
    { name: 'Angebote Handwerker einholen', done: false },
    { name: 'Austausch der Fenster (Lieferung & Montage)', done: false },
    { name: 'Bestellung Material', done: false },
    { name: 'Entkernung Bad', done: false },
    { name: 'Installation Elektro', done: false },
    { name: 'Installation Sanitär', done: false },
    { name: 'Fliesenarbeiten', done: false },
    { name: 'Montage Endgeräte', done: false },
    { name: 'Finale Abnahme', done: false }
  ];

  doneCount = signal(this.milestones.filter(m => m.done).length);
  
  calculateProgress() {
    return Math.round((this.doneCount() / this.milestones.length) * 100);
  }
}
