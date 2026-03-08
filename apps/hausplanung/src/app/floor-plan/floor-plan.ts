import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-floor-plan',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="floor-plan-container glass-card">
      <div class="floor-plan-header">
        <div class="header-content">
          <h3>Interaktiver Grundriss</h3>
          <p class="subtitle">Wählen Sie ein Stockwerk und klicken Sie auf einen Raum.</p>
        </div>
        <div class="view-toggle">
          <button [class.active]="currentView === 'eg'" (click)="currentView = 'eg'">Erdgeschoss</button>
          <button [class.active]="currentView === 'keller'" (click)="currentView = 'keller'">Keller / UG</button>
        </div>
      </div>
      
      <!-- ERDGESCHOSS VIEW -->
      <svg *ngIf="currentView === 'eg'" viewBox="0 0 1100 850" xmlns="http://www.w3.org/2000/svg" class="floor-plan-svg">
        <defs>
          <filter id="roomShadow" x="-2%" y="-2%" width="104%" height="104%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.1"/>
          </filter>
        </defs>

        <g class="room garage" (click)="onRoomClick('garage')" [class.active]="activeRoomId === 'garage'">
          <rect x="20" y="250" width="180" height="480" rx="4" />
          <text x="110" y="470" class="room-label">Garage</text>
          <text x="110" y="490" class="room-detail">25,24 m²</text>
        </g>

        <g class="room" (click)="onRoomClick('wohnraum')" [class.active]="activeRoomId === 'wohnraum'">
          <rect x="230" y="40" width="330" height="218" rx="2" />
          <text x="395" y="130" class="room-label">Wohnraum</text>
          <text x="395" y="150" class="room-detail">5,51m x 3,64m</text>
          <text x="395" y="165" class="room-area">20,02 m²</text>
        </g>

        <g class="room" (click)="onRoomClick('essraum')" [class.active]="activeRoomId === 'essraum'">
          <rect x="230" y="258" width="334" height="218" rx="2" />
          <text x="397" y="350" class="room-label">Essraum</text>
          <text x="397" y="370" class="room-detail">5,56m x 3,64m</text>
          <text x="397" y="385" class="room-area">20,21 m²</text>
        </g>

        <g class="room" (click)="onRoomClick('kueche')" [class.active]="activeRoomId === 'kueche'">
          <rect x="230" y="476" width="190" height="273" rx="2" />
          <text x="325" y="600" class="room-label">Küche</text>
          <text x="325" y="620" class="room-detail">3,18m x 4,56m</text>
          <text x="325" y="635" class="room-area">14,47 m²</text>
        </g>

        <g class="room" (click)="onRoomClick('flur')" [class.active]="activeRoomId === 'flur'">
          <rect x="420" y="476" width="144" height="130" rx="2" />
          <text x="492" y="535" class="room-label">Diele</text>
          <text x="492" y="555" class="room-area">12,25 m²</text>
        </g>

        <g class="room" (click)="onRoomClick('garderobe')" [class.active]="activeRoomId === 'garderobe'">
          <rect x="420" y="606" width="120" height="143" rx="2" />
          <text x="480" y="670" class="room-label-small">Garderobe</text>
          <text x="480" y="698" class="room-area-tiny">4,79 m²</text>
        </g>

        <g class="room" (click)="onRoomClick('wc')" [class.active]="activeRoomId === 'wc'">
          <rect x="540" y="606" width="72" height="143" rx="2" />
          <text x="576" y="670" class="room-label-small">WC</text>
          <text x="576" y="698" class="room-area-tiny">2,86 m²</text>
        </g>

        <g class="room" (click)="onRoomClick('flur_privat')" [class.active]="activeRoomId === 'flur_privat'">
          <rect x="564" y="258" width="69" height="348" rx="2" />
          <text x="598" y="430" class="room-label-small" transform="rotate(-90, 598, 430)">Flur (P)</text>
          <text x="598" y="450" class="room-area-tiny">3,84 m²</text>
        </g>

        <g class="room" (click)="onRoomClick('bad')" [class.active]="activeRoomId === 'bad'">
          <rect x="633" y="40" width="120" height="198" rx="2" />
          <text x="693" y="120" class="room-label-small">Bad</text>
          <text x="693" y="153" class="room-area-tiny">6,64 m²</text>
        </g>

        <g class="room" (click)="onRoomClick('schlafzimmer')" [class.active]="activeRoomId === 'schlafzimmer'">
          <rect x="753" y="40" width="233" height="273" rx="2" />
          <text x="870" y="160" class="room-label">Schlafzimmer</text>
          <text x="870" y="195" class="room-area">17,70 m²</text>
        </g>

        <g class="room" (click)="onRoomClick('kinderzimmer')" [class.active]="activeRoomId === 'kinderzimmer'">
          <rect x="753" y="313" width="233" height="194" rx="2" />
          <text x="870" y="400" class="room-label">Kind</text>
          <text x="870" y="435" class="room-area">12,56 m²</text>
        </g>

        <g class="room" (click)="onRoomClick('zimmer')" [class.active]="activeRoomId === 'zimmer'">
          <rect x="633" y="507" width="171" height="218" rx="2" />
          <text x="718" y="600" class="room-label-small">Büro</text>
          <text x="718" y="633" class="room-area-tiny">10,35 m²</text>
        </g>
      </svg>

      <!-- KELLER VIEW -->
      <svg *ngIf="currentView === 'keller'" viewBox="0 0 1100 850" xmlns="http://www.w3.org/2000/svg" class="floor-plan-svg">
        <!-- KELLERFLUR -->
        <g class="room" (click)="onRoomClick('kellerflur')" [class.active]="activeRoomId === 'kellerflur'">
          <rect x="420" y="258" width="144" height="348" rx="2" />
          <text x="492" y="430" class="room-label-small" transform="rotate(-90, 492, 430)">Kellerflur</text>
          <text x="492" y="450" class="room-area-tiny">14,52 m²</text>
        </g>

        <!-- HEIZRAUM -->
        <g class="room secondary" (click)="onRoomClick('kellerflur')">
          <rect x="230" y="450" width="190" height="218" rx="2" />
          <text x="325" y="550" class="room-label-small">Heizraum</text>
          <text x="325" y="570" class="room-detail-tiny">14,47 m²</text>
        </g>

        <!-- SPIELRAUM / KELLER -->
        <g class="room secondary" (click)="onRoomClick('kellerflur')">
          <rect x="564" y="450" width="190" height="218" rx="2" />
          <text x="659" y="550" class="room-label-small">Spielraum</text>
          <text x="659" y="570" class="room-detail-tiny">25,14 m²</text>
        </g>

        <!-- TROCKENRAUM -->
        <g class="room secondary" (click)="onRoomClick('kellerflur')">
          <rect x="754" y="507" width="233" height="194" rx="2" />
          <text x="870" y="590" class="room-label-small">Trockenraum</text>
          <text x="870" y="610" class="room-detail-tiny">28,88 m²</text>
        </g>

        <!-- ZIMMER KELLER (BÜRO) -->
        <g class="room" (click)="onRoomClick('keller_buero')" [class.active]="activeRoomId === 'keller_buero'">
          <rect x="754" y="313" width="150" height="194" rx="2" />
          <text x="829" y="400" class="room-label">Büro</text>
          <text x="829" y="420" class="room-detail">12,60 m²</text>
        </g>

        <!-- WEITERE KELLERRÄUME OBEN -->
        <g class="room secondary" (click)="onRoomClick('kellerflur')">
          <rect x="230" y="40" width="330" height="218" rx="2" />
          <text x="395" y="140" class="room-label-small">Keller 1</text>
          <text x="395" y="160" class="room-detail-tiny">20,35 m²</text>
        </g>
        
        <g class="room secondary" (click)="onRoomClick('kellerflur')">
          <rect x="230" y="258" width="190" height="192" rx="2" />
          <text x="325" y="340" class="room-label-small">Keller 2</text>
          <text x="325" y="360" class="room-detail-tiny">20,21 m²</text>
        </g>
      </svg>
    </div>
  `,
  styles: [`
    .floor-plan-container {
      width: 100%;
      background: #ffffff;
      padding: 2rem;
      border-radius: 16px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.08);
      border: 1px solid rgba(0,0,0,0.05);
    }

    @media (max-width: 768px) {
      .floor-plan-container { padding: 1.25rem; }
      .floor-plan-header h3 { font-size: 1.25rem; }
      .view-toggle button { padding: 6px 12px; font-size: 0.85rem; }
    }

    @media (max-width: 480px) {
      .floor-plan-container { padding: 0.75rem; }
      .floor-plan-header { margin-bottom: 1.25rem; }
    }


    .floor-plan-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .header-content {
      border-left: 4px solid #3498db;
      padding-left: 1rem;
    }

    .floor-plan-header h3 {
      margin: 0;
      color: #2c3e50;
      font-size: 1.5rem;
    }

    .subtitle {
      color: #7f8c8d;
      margin: 0.25rem 0 0 0;
      font-size: 0.9rem;
    }

    .view-toggle {
      display: flex;
      background: #f8f9fa;
      padding: 4px;
      border-radius: 8px;
      border: 1px solid #dee2e6;
    }

    .view-toggle button {
      border: none;
      background: transparent;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      color: #7f8c8d;
      transition: all 0.3s ease;
    }

    .view-toggle button.active {
      background: #ffffff;
      color: #3498db;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .floor-plan-svg {
      width: 100%;
      height: auto;
      display: block;
    }

    .room {
      cursor: pointer;
      transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
    }

    .room rect {
      fill: #fdfdfd;
      stroke: #bdc3c7;
      stroke-width: 1.5;
    }

    .room:hover rect {
      fill: #f0f7ff;
      stroke: #3498db;
    }

    .room.active rect {
      fill: #3498db;
      stroke: #2980b9;
      stroke-width: 3;
    }

    .room.secondary rect {
      fill: #fcfcfc;
      stroke: #e0e0e0;
      stroke-dasharray: 2;
    }

    .room-label, .room-label-small {
      fill: #2c3e50;
      font-weight: 700;
      text-anchor: middle;
      pointer-events: none;
    }

    .room-label { font-size: 14px; text-transform: uppercase; }
    .room-label-small { font-size: 11px; }

    .room-detail, .room-detail-tiny {
      fill: #7f8c8d;
      text-anchor: middle;
      pointer-events: none;
    }

    .room-detail { font-size: 11px; }
    .room-detail-tiny { font-size: 9px; }

    .room-area, .room-area-tiny {
      fill: #3498db;
      font-weight: 700;
      text-anchor: middle;
      pointer-events: none;
    }

    .room-area { font-size: 11px; }
    .room-area-tiny { font-size: 9px; }

    .room.active text { fill: #ffffff !important; }

    .room.garage rect { fill: #f8f9fa; stroke-dasharray: 4; }
  `]
})
export class FloorPlanComponent {
  @Input() activeRoomId: string | null = null;
  @Output() roomSelected = new EventEmitter<string>();

  currentView: 'eg' | 'keller' = 'eg';

  onRoomClick(roomId: string) {
    this.roomSelected.emit(roomId);
  }
}


