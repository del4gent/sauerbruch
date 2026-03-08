import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import roomsData from '../../../../public/assets/data/rooms.json';

@Component({
  selector: 'app-budget',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="details-container">
      <div class="breadcrumb mobile-breadcrumb">
        <a routerLink="/">Dashboard</a> / Budget
      </div>
      <header class="details-header">
        <a routerLink="/" class="btn-back">← Dashboard</a>
        <h1 class="gradient-text">Budget Herleitung</h1>
        <p class="subtitle">Detaillierte Kostenaufstellung pro Raum</p>
      </header>

      <div class="glass-card table-card">
        <table class="details-table">
          <thead>
            <tr>
              <th>Raum</th>
              <th>Status</th>
              <th class="text-right">Kalkuliertes Budget</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let room of rooms">
              <td data-label="Raum">{{ room.name }}</td>
              <td data-label="Status"><span class="badge">{{ room.status }}</span></td>
              <td data-label="Budget" class="text-right font-mono">{{ formatCurrency(room.budget) }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td colspan="2" data-label="Gesamt">Gesamtsumme</td>
              <td data-label="Summe" class="text-right font-mono">{{ formatCurrency(totalBudget()) }}</td>
            </tr>
          </tfoot>

        </table>
      </div>

      <div class="glass-card info-box">
        <h3>💡 Info zur Kalkulation</h3>
        <p>Die Beträge basieren auf ersten Schätzungen und Materiallisten. Finale Kosten werden nach Auftragserteilung an Fachbetriebe aktualisiert.</p>
      </div>
    </div>
  `,
  styles: [`
    .details-container { max-width: 900px; margin: 0 auto; }
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

    .badge { background: rgba(255,255,255,0.1); padding: 0.25rem 0.75rem; border-radius: 8px; font-size: 0.8rem; }
  `]
})
export class BudgetComponent {
  // Define only the rooms currently planned for renovation
  private plannedRoomIds = ['flur', 'wohnraum', 'bad', 'wc', 'kellerflur'];
  
  rooms = (roomsData as any[]).filter(r => this.plannedRoomIds.includes(r.id));
  
  totalBudget = signal(this.rooms.reduce((acc, r) => acc + r.budget, 0));

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
  }
}
