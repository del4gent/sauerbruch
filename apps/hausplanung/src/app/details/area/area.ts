import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FloorPlanComponent } from '../../floor-plan/floor-plan';
import { RoomService } from '../../services/room.service';

@Component({
  selector: 'app-area',
  standalone: true,
  imports: [CommonModule, RouterModule, FloorPlanComponent],
  templateUrl: './area.html',
  styleUrl: './area.css'
})
export class AreaComponent {
  constructor(private router: Router, public roomService: RoomService) {}

  onRoomSelected(roomId: string) {
    this.router.navigate(['/room', roomId]);
  }
}
