import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FloorPlanComponent } from '../../floor-plan/floor-plan';
import { RoomStore } from '../../store/room.store';

@Component({
  selector: 'app-area',
  standalone: true,
  imports: [CommonModule, RouterModule, FloorPlanComponent],
  templateUrl: './area.html',
  styleUrl: './area.css'
})
export class AreaComponent {
  public roomService = inject(RoomStore);
  private readonly router = inject(Router);

  onRoomSelected(roomId: string) {
    this.router.navigate(['/room', roomId]);
  }
}
