import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [CommonModule, RouterModule],
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
              <td>{{ m.name }}</td>
              <td class="text-right">
                <span class="badge" [class.badge-done]="m.done">{{ m.done ? '✅ Erledigt' : '⏳ Offen' }}</span>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td>Gesamtfortschritt</td>
              <td class="text-right font-mono">{{ calculateProgress() }}%</td>
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
    
    .table-card { padding: 0; overflow: hidden; }
    .details-table { width: 100%; border-collapse: collapse; }
    .details-table th, .details-table td { padding: 1.25rem 2rem; border-bottom: 1px solid var(--border-color); text-align: left; }
    .details-table th { background: rgba(255,255,255,0.05); font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.6; }
    
    .text-right { text-align: right !important; }
    .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-weight: 700; }
    
    .total-row { background: rgba(59, 130, 246, 0.1); font-size: 1.25rem; font-weight: 800; }
    .total-row td { border-bottom: none; }

    .info-box { margin-top: 2rem; padding: 2rem; }
    .info-box h3 { margin-top: 0; color: var(--primary-color); }
    .info-box p { margin-bottom: 0; opacity: 0.7; }

    .badge { background: rgba(255,255,255,0.05); padding: 0.4rem 0.8rem; border-radius: 10px; font-size: 0.8rem; font-weight: 700; display: inline-block; border: 1px solid rgba(255,255,255,0.1); }
    .badge-done { background: rgba(34, 197, 94, 0.1); color: #4ade80; border-color: rgba(34, 197, 94, 0.2); }
  `]
})
export class ProgressComponent {
  milestones = [
    { name: 'Datenaufnahme & Maße (m²)', done: true },
    { name: 'Erstellung Leistungsverzeichnis', done: true },
    { name: 'Angebote Handwerker einholen', done: false },
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
