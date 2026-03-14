import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RoomCardComponent } from '../ui/room-card/room-card.component';
import { StatCardComponent } from '../ui/stat-card/stat-card.component';
import { RoomStore } from '../store/room.store';
import { calculateMilestoneProgress, ROOM_MILESTONES } from '../shared/hausplanung.constants';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, RoomCardComponent, StatCardComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit, OnDestroy {
  readonly milestones = ROOM_MILESTONES;
  readonly totalProgress = calculateMilestoneProgress(this.milestones);

  currentImageIndices: Record<string, number> = {};
  private intervalId: ReturnType<typeof setInterval> | null = null;

  public roomService = inject(RoomStore);

  ngOnInit() {
    this.roomService.sortedRooms().forEach((room) => {
      this.currentImageIndices[room.id] = 0;
    });

    this.intervalId = setInterval(() => {
      this.roomService.sortedRooms().forEach((room) => {
        const imgs = this.roomService.getRoomDisplayImages(room.id);
        if (imgs.length > 1) {
          this.currentImageIndices[room.id] = (this.currentImageIndices[room.id] + 1) % imgs.length;
        }
      });
    }, 6000);
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
