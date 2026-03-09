import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { StatusBadgeComponent } from '../../ui/status-badge/status-badge.component';
import { RoomService } from '../../services/room.service';

@Component({
  selector: 'app-budget',
  standalone: true,
  imports: [CommonModule, RouterModule, StatusBadgeComponent],
  templateUrl: './budget.html',
  styleUrl: './budget.css'
})
export class BudgetComponent {
  constructor(public roomService: RoomService) {}
}
