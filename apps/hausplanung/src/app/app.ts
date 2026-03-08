import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { forkJoin, map, of } from 'rxjs';
import { FloorPlanComponent } from './floor-plan/floor-plan';
import roomsData from '../../public/assets/data/rooms.json';

interface RoomInfo {
  id: string;
  name: string;
  area: number;
  area_derivation: string;
  status: string;
  budget: number;
  path: string;
  content?: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule, FloorPlanComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  title = 'Projekt Sauerbruch 3';
  rooms: RoomInfo[] = roomsData as RoomInfo[];
  totalArea = 0;
  totalBudget = 0;
  loading = true;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.calculateTotals();
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadMarkdownContent();
    } else {
      this.loading = false;
    }
  }

  loadMarkdownContent() {
    const contentRequests = this.rooms.map(room => 
      this.http.get(`assets/${room.path}`, { responseType: 'text' }).pipe(
        map(content => ({ ...room, content }))
      )
    );

    forkJoin(contentRequests).subscribe({
      next: (data) => {
        this.rooms = data;
        this.calculateTotals();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading markdown:', err);
        this.loading = false;
      }
    });
  }

  calculateTotals() {
    this.totalArea = this.rooms.reduce((acc, room) => acc + room.area, 0);
    this.totalBudget = this.rooms.reduce((acc, room) => acc + (room.budget || 0), 0);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
  }

  formatArea(value: number): string {
    return value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' m²';
  }

  scrollToRoom(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
