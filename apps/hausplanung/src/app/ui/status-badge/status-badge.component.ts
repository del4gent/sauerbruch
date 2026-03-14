import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { getStatusBadgeClass } from '../../shared/hausplanung.constants';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-badge.component.html',
  styleUrl: './status-badge.component.css'
})
export class StatusBadgeComponent {
  @Input() status = '';
  @Input() label = '';
  @Input() showDot = true;
  @Input() variant: 'auto' | 'done' | 'pending' = 'auto';

  get statusClass(): string {
    return getStatusBadgeClass(this.status, this.variant);
  }
}
