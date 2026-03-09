import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="badge" [ngClass]="statusClass">
      <span class="status-dot" *ngIf="showDot"></span>
      {{ label || status }}
    </div>
  `,
  styles: [`
    .badge { 
      display: inline-flex; 
      align-items: center; 
      gap: 0.5rem; 
      padding: 0.35rem 0.8rem; 
      border-radius: 10px; 
      font-size: 0.75rem; 
      font-weight: 800; 
      text-transform: uppercase; 
      letter-spacing: 0.05em;
      white-space: nowrap;
      transition: all 0.2s ease;
    }
    
    .status-dot { 
      width: 8px; 
      height: 8px; 
      border-radius: 50%; 
      display: inline-block; 
    }
    
    /* Variants */
    .status-active { 
      background: rgba(59, 130, 246, 0.15); 
      color: #60a5fa; 
      border: 1px solid rgba(59, 130, 246, 0.3); 
    }
    .status-active .status-dot { background: #60a5fa; box-shadow: 0 0 10px #3b82f6; }
    
    .status-planned { 
      background: rgba(148, 163, 184, 0.1);
      color: #94a3b8; 
      border: 1px solid rgba(148, 163, 184, 0.2);
    }
    .status-planned .status-dot { background: #94a3b8; }

    .status-onhold { 
      background: rgba(248, 113, 113, 0.1);
      color: #f87171; 
      border: 1px solid rgba(248, 113, 113, 0.2);
    }
    .status-onhold .status-dot { background: #f87171; }

    .status-finished { 
      background: rgba(74, 222, 128, 0.15);
      color: #4ade80; 
      border: 1px solid rgba(74, 222, 128, 0.3);
    }
    .status-finished .status-dot { background: #4ade80; box-shadow: 0 0 10px #22c55e; }

    /* Generic variants for Progress/Budget */
    .status-done { 
      background: rgba(34, 197, 94, 0.1); 
      color: #4ade80; 
      border: 1px solid rgba(34, 197, 94, 0.2); 
    }
    .status-pending { 
      background: rgba(255, 255, 255, 0.05); 
      color: rgba(255, 255, 255, 0.6); 
      border: 1px solid rgba(255, 255, 255, 0.1); 
    }
  `]
})
export class StatusBadgeComponent {
  @Input() status: string = '';
  @Input() label: string = '';
  @Input() showDot: boolean = true;
  @Input() variant: 'auto' | 'done' | 'pending' = 'auto';

  get statusClass(): string {
    if (this.variant === 'done') return 'status-done';
    if (this.variant === 'pending') return 'status-pending';

    switch (this.status) {
      case 'Angefangen': return 'status-active';
      case 'In Planung': return 'status-planned';
      case 'Fertig': return 'status-finished';
      case 'On hold': return 'status-onhold';
      default: return 'status-planned';
    }
  }
}
