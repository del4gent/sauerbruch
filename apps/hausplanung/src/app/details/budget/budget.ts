import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { StatusBadgeComponent } from '../../ui/status-badge/status-badge.component';
import { RoomStore } from '../../store/room.store';

@Component({
  selector: 'app-budget',
  standalone: true,
  imports: [CommonModule, RouterModule, StatusBadgeComponent],
  templateUrl: './budget.html',
  styleUrl: './budget.css'
})
export class BudgetComponent {
  public roomService = inject(RoomStore);
}
