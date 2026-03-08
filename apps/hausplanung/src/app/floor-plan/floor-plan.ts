import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-floor-plan',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="floor-plan-container glass-card">
      <svg viewBox="0 0 1000 800" xmlns="http://www.w3.org/2000/svg">
        <!-- Garage -->
        <g class="room" (click)="onRoomClick('garage')" [class.active]="activeRoomId === 'garage'">
          <rect x="20" y="250" width="160" height="450" />
          <text x="100" y="475" class="room-label">Garage</text>
        </g>

        <!-- Wohnraum -->
        <g class="room" (click)="onRoomClick('wohnraum')" [class.active]="activeRoomId === 'wohnraum'">
          <rect x="200" y="50" width="250" height="250" />
          <text x="325" y="175" class="room-label">Wohnraum</text>
        </g>

        <!-- Essraum -->
        <g class="room" (click)="onRoomClick('essraum')" [class.active]="activeRoomId === 'essraum'">
          <rect x="200" y="300" width="250" height="200" />
          <text x="325" y="400" class="room-label">Essraum</text>
        </g>

        <!-- Küche -->
        <g class="room" (click)="onRoomClick('kueche')" [class.active]="activeRoomId === 'kueche'">
          <rect x="200" y="510" width="200" height="240" />
          <text x="300" y="630" class="room-label">Küche</text>
        </g>

        <!-- Flur -->
        <g class="room" (click)="onRoomClick('flur')" [class.active]="activeRoomId === 'flur'">
          <rect x="460" y="300" width="160" height="300" />
          <text x="540" y="450" class="room-label">Flur</text>
        </g>

        <!-- Garderobe -->
        <g class="room" (click)="onRoomClick('garderobe')" [class.active]="activeRoomId === 'garderobe'">
          <rect x="460" y="610" width="120" height="140" />
          <text x="520" y="680" class="room-label">Garderobe</text>
        </g>

        <!-- WC -->
        <g class="room" (click)="onRoomClick('wc')" [class.active]="activeRoomId === 'wc'">
          <rect x="590" y="660" width="100" height="90" />
          <text x="640" y="705" class="room-label">WC</text>
        </g>

        <!-- Bad -->
        <g class="room" (click)="onRoomClick('bad')" [class.active]="activeRoomId === 'bad'">
          <rect x="630" y="350" width="120" height="180" />
          <text x="690" y="440" class="room-label">Bad</text>
        </g>

        <!-- Schlafzimmer -->
        <g class="room" (click)="onRoomClick('schlafzimmer')" [class.active]="activeRoomId === 'schlafzimmer'">
          <rect x="760" y="350" width="220" height="250" />
          <text x="870" y="475" class="room-label">Schlafzimmer</text>
        </g>

        <!-- Flur Privat -->
        <g class="room" (click)="onRoomClick('flur_privat')" [class.active]="activeRoomId === 'flur_privat'">
          <rect x="630" y="540" width="130" height="60" />
          <text x="695" y="575" class="room-label-small">Flur (P)</text>
        </g>

        <!-- Kinderzimmer -->
        <g class="room" (click)="onRoomClick('kinderzimmer')" [class.active]="activeRoomId === 'kinderzimmer'">
          <rect x="760" y="610" width="220" height="180" />
          <text x="870" y="700" class="room-label">Kinderzimmer</text>
        </g>

        <!-- Zimmer / Büro -->
        <g class="room" (click)="onRoomClick('zimmer')" [class.active]="activeRoomId === 'zimmer'">
          <rect x="610" y="610" width="140" height="180" />
          <text x="680" y="700" class="room-label">Büro</text>
        </g>

        <!-- Kellerflur (Externer Block) -->
        <g class="room" (click)="onRoomClick('kellerflur')" [class.active]="activeRoomId === 'kellerflur'">
          <rect x="460" y="50" width="520" height="80" rx="10" />
          <text x="720" y="95" class="room-label">Kellerflur (Untergeschoss)</text>
        </g>
      </svg>
    </div>
  `,
  styles: [`
    .floor-plan-container {
      width: 100%;
      background: white;
      padding: 2rem;
      margin-bottom: 2rem;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.05);
    }

    svg {
      width: 100%;
      height: auto;
      display: block;
    }

    .room {
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .room rect {
      fill: #f8f9fa;
      stroke: #dee2e6;
      stroke-width: 2;
      transition: all 0.3s ease;
    }

    .room:hover rect {
      fill: #e3f2fd;
      stroke: #3498db;
    }

    .room.active rect {
      fill: #3498db;
      stroke: #2980b9;
    }

    .room-label {
      fill: #2c3e50;
      font-size: 16px;
      font-weight: 700;
      text-anchor: middle;
      pointer-events: none;
      text-transform: uppercase;
    }

    .room-label-small {
      fill: #7f8c8d;
      font-size: 12px;
      font-weight: 600;
      text-anchor: middle;
      pointer-events: none;
    }

    .room.active .room-label {
      fill: white;
    }

    .room.active .room-label-small {
      fill: rgba(255,255,255,0.8);
    }
  `]
})
export class FloorPlanComponent {
  @Input() activeRoomId: string | null = null;
  @Output() roomSelected = new EventEmitter<string>();

  onRoomClick(roomId: string) {
    this.roomSelected.emit(roomId);
  }
}
