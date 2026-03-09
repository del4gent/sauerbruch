import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-badge.component.html',
  styleUrl: './status-badge.component.css'
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
      case 'In Arbeit':
      case 'Angefangen': return 'status-active';
      case 'In Planung': return 'status-planned';
      case 'Fertig': return 'status-finished';
      case 'Pausiert': return 'status-paused';
      default: return 'status-planned';
    }
  }
}
