import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RoomCardComponent } from '../ui/room-card/room-card.component';
import { StatCardComponent } from '../ui/stat-card/stat-card.component';
import { RoomService } from '../services/room.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, RoomCardComponent, StatCardComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit, OnDestroy {
  private milestones = [
    { name: 'Datenaufnahme & Maße (m²)', done: true },
    { name: 'Erstellung Leistungsverzeichnis', done: true },
    { name: 'Angebote Handwerker einholen', done: false },
    { name: 'Austausch der Fenster', done: false },
    { name: 'Bestellung Material', done: false },
    { name: 'Entkernung Bad', done: false },
    { name: 'Installation Elektro', done: false },
    { name: 'Installation Sanitär', done: false },
    { name: 'Fliesenarbeiten', done: false },
    { name: 'Montage Endgeräte', done: false },
    { name: 'Finale Abnahme', done: false }
  ];

  totalProgress = Math.round((this.milestones.filter(m => m.done).length / this.milestones.length) * 100);

  currentImageIndices: Record<string, number> = {};
  private intervalId: any;

  constructor(public roomService: RoomService) {}

  ngOnInit() {
    this.roomService.sortedRooms().forEach(room => {
      this.currentImageIndices[room.id] = 0;
    });

    this.intervalId = setInterval(() => {
      this.roomService.sortedRooms().forEach(room => {
        const imgs = this.roomService.getRoomInspirationImages(room.id);
        if (imgs.length > 1) {
          this.currentImageIndices[room.id] = (this.currentImageIndices[room.id] + 1) % imgs.length;
        }
      });
    }, 6000);
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}
