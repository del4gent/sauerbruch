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

        <!-- Garage -->
        <g class="room garage" (click)="onRoomClick('garage')" [class.active]="activeRoomId === 'garage'">
          <rect x="20" y="40" width="180" height="505" rx="4" fill="none" stroke="#dfe4e8" stroke-dasharray="4" />
          <text x="110" y="280" class="room-label opacity-60">Garage</text>
          <text x="110" y="300" class="room-detail opacity-60">25,24 m²</text>
        </g>

        <!-- Wohnzimmer Gesamt (Wohnraum + Essraum) -->
        <g class="room" (click)="onRoomClick('wohnraum')" [class.active]="activeRoomId === 'wohnraum'">
          <rect x="230" y="40" width="334" height="218" rx="2" />
          <text x="397" y="130" class="room-label">Wohnzimmer</text>
          <text x="397" y="150" class="room-detail">(Gesamt)</text>
          <text x="397" y="170" class="room-area">40,23 m²</text>
        </g>

        <!-- Küche -->
        <g class="room" (click)="onRoomClick('kueche')" [class.active]="activeRoomId === 'kueche'">
          <rect x="230" y="258" width="190" height="180" rx="2" />
          <text x="325" y="325" class="room-label">Küche</text>
          <text x="325" y="345" class="room-detail">3,18m x 4,56m</text>
          <text x="325" y="360" class="room-area">14,47 m²</text>
        </g>

        <!-- Flur Gesamt (zentraler Bereich) -->
        <g class="room" (click)="onRoomClick('flur')" [class.active]="activeRoomId === 'flur'">
          <rect x="420" y="258" width="264" height="180" rx="2" />
          <text x="552" y="345" class="room-label">Flur</text>
          <text x="552" y="370" class="room-area">20,88 m²</text>
        </g>

        <!-- Bad -->
        <g class="room" (click)="onRoomClick('bad')" [class.active]="activeRoomId === 'bad'">
          <rect x="564" y="40" width="120" height="218" rx="2" />
          <text x="624" y="135" class="room-label-small">Bad</text>
          <text x="624" y="163" class="room-area-tiny">6,64 m²</text>
        </g>

        <!-- Schlafzimmer -->
        <g class="room" (click)="onRoomClick('schlafzimmer')" [class.active]="activeRoomId === 'schlafzimmer'">
          <rect x="684" y="40" width="233" height="398" rx="2" />
          <text x="800" y="220" class="room-label">Schlafzimmer</text>
          <text x="800" y="255" class="room-area">17,70 m²</text>
        </g>

        <!-- WC -->
        <g class="room" (click)="onRoomClick('wc')" [class.active]="activeRoomId === 'wc'">
          <rect x="420" y="438" width="100" height="117" rx="2" />
          <text x="470" y="495" class="room-label-small">WC</text>
          <text x="470" y="515" class="room-area-tiny">2,86 m²</text>
        </g>

        <!-- Zimmer / Büro -->
        <g class="room" (click)="onRoomClick('zimmer')" [class.active]="activeRoomId === 'zimmer'">
          <rect x="520" y="438" width="164" height="117" rx="2" />
          <text x="602" y="495" class="room-label-small">Zimmer</text>
          <text x="602" y="515" class="room-area-tiny">10,35 m²</text>
        </g>

        <!-- Kinderzimmer -->
        <g class="room" (click)="onRoomClick('kinderzimmer')" [class.active]="activeRoomId === 'kinderzimmer'">
          <rect x="684" y="438" width="233" height="117" rx="2" />
          <text x="800" y="495" class="room-label">Kinderzimmer</text>
          <text x="800" y="515" class="room-area-tiny">12,56 m²</text>
        </g>
      </svg>

      <!-- KELLER VIEW -->
      <svg *ngIf="currentView === 'keller'" viewBox="0 0 1100 850" xmlns="http://www.w3.org/2000/svg" class="floor-plan-svg">
        <!-- KELLERRAUM 2 -->
        <g class="room secondary" (click)="onRoomClick('kellerflur')">
          <rect x="230" y="40" width="190" height="120" rx="2" />
          <text x="325" y="105" class="room-label-small">Keller 2</text>
        </g>

        <!-- KELLERRAUM 1 -->
        <g class="room secondary" (click)="onRoomClick('kellerflur')">
          <rect x="230" y="160" width="190" height="120" rx="2" />
          <text x="325" y="225" class="room-label-small">Keller 1</text>
        </g>

        <!-- HEIZRAUM -->
        <g class="room secondary" (click)="onRoomClick('kellerflur')">
          <rect x="230" y="280" width="190" height="250" rx="2" />
          <text x="325" y="405" class="room-label-small">Heizraum</text>
        </g>

        <!-- KELLERFLUR -->
        <g class="room" (click)="onRoomClick('kellerflur')" [class.active]="activeRoomId === 'kellerflur'">
          <rect x="420" y="280" width="264" height="250" rx="2" />
          <text x="552" y="390" class="room-label-small">Kellerflur</text>
          <text x="552" y="410" class="room-label-tiny opacity-40">Spielbereich</text>
          <text x="552" y="435" class="room-area-tiny">14,52 m²</text>
        </g>

        <!-- BÜRO KELLER -->
        <g class="room" (click)="onRoomClick('keller_buero')" [class.active]="activeRoomId === 'keller_buero'">
          <rect x="684" y="280" width="233" height="250" rx="2" />
          <text x="800" y="405" class="room-label-small">Büro</text>
          <text x="800" y="430" class="room-area-tiny">12,60 m²</text>
        </g>

        <!-- ANSCHLUSSKELLER -->
        <g class="room secondary" (click)="onRoomClick('kellerflur')">
          <rect x="420" y="530" width="132" height="120" rx="2" />
          <text x="486" y="585" class="room-label-tiny">Anschluss</text>
        </g>

        <!-- WASCHRAUM -->
        <g class="room secondary" (click)="onRoomClick('kellerflur')">
          <rect x="552" y="530" width="132" height="120" rx="2" />
          <text x="618" y="585" class="room-label-tiny">Waschraum</text>
        </g>

        <!-- TROCKENRAUM -->
        <g class="room secondary" (click)="onRoomClick('kellerflur')">
          <rect x="684" y="530" width="233" height="120" rx="2" />
          <text x="800" y="585" class="room-label-tiny">Trockenraum</text>
          <text x="800" y="605" class="room-detail-tiny">28,88 m²</text>
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

    .room-label, .room-label-small, .room-label-tiny {
      fill: #2c3e50;
      font-weight: 700;
      text-anchor: middle;
      pointer-events: none;
    }

    .room-label { font-size: 14px; text-transform: uppercase; }
    .room-label-small { font-size: 11px; }
    .room-label-tiny { font-size: 9px; }

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
    
    .opacity-40 { opacity: 0.4; }
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
