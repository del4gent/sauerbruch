import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { StatusBadgeComponent } from '../../ui/status-badge/status-badge.component';
import roomsData from '../../../../public/assets/data/rooms.json';

@Component({
  selector: 'app-budget',
  standalone: true,
  imports: [CommonModule, RouterModule, StatusBadgeComponent],
  template: `
    <div class="details-container">
      <header class="details-header">
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
              <td data-label="Status">
                <app-status-badge [status]="room.status" [showDot]="false"></app-status-badge>
              </td>
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
    
    .table-card { padding: 0; overflow: hidden; }
    
    .total-row { background: rgba(59, 130, 246, 0.1); }

    .info-box { margin-top: 2rem; padding: 2rem; }
    .info-box h3 { margin-top: 0; color: var(--primary-color); }
    .info-box p { margin-bottom: 0; opacity: 0.7; }
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
