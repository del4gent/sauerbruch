import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';

@Component({
  selector: 'app-room-card',
  standalone: true,
  imports: [CommonModule, RouterModule, StatusBadgeComponent],
  templateUrl: './room-card.component.html',
  styleUrl: './room-card.component.css'
})
export class RoomCardComponent {
  @Input() room: any;
  @Input() images: string[] = [];
  @Input() currentImageIndex: number = 0;
}
