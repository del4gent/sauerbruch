import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoomService } from '../services/room.service';

@Component({
  selector: 'app-floor-plan',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './floor-plan.html',
  styleUrl: './floor-plan.css'
})
export class FloorPlanComponent {
  @Input() activeRoomId: string | null = null;
  @Output() roomSelected = new EventEmitter<string>();

  currentView: 'eg' | 'keller' = 'eg';

  constructor(private roomService: RoomService) {}

  getRoomStatus(roomId: string): string {
    const room = this.roomService.getRoomById(roomId);
    return room ? room.status : '';
  }

  onRoomClick(roomId: string) {
    this.roomSelected.emit(roomId);
  }
}
