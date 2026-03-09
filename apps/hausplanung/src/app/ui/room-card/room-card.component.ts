import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';

@Component({
  selector: 'app-room-card',
  standalone: true,
  imports: [CommonModule, RouterModule, StatusBadgeComponent],
  template: `
    <div class="glass-card room-card" [routerLink]="['/room', room.id]">
      <div class="room-preview-container">
        <div *ngFor="let img of images; let i = index" 
             class="room-preview" 
             [class.active]="i === currentImageIndex"
             [style.backgroundImage]="'url(' + img + ')'">
        </div>
        <div class="no-preview" *ngIf="images.length === 0">
          <span>Kein Vorschaubild</span>
        </div>
      </div>
      <div class="room-overlay"></div>
      <div class="room-content-wrapper">
        <div class="room-info">
          <h3>{{ room.name }}</h3>
          <p>{{ room.area }} m² <span class="derivation-hint">({{ room.area_derivation }})</span></p>
          <app-status-badge [status]="room.status"></app-status-badge>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .room-card { 
      aspect-ratio: 16/10;
      display: flex; 
      cursor: pointer; transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
      position: relative; overflow: hidden;
      border-radius: 24px;
      padding: 0;
      background: #0f172a;
      border: 1px solid var(--border-color);
    }
    .room-card:hover { transform: translateY(-8px); border-color: rgba(255,255,255,0.3); }

    @media (max-width: 768px) {
      .room-card {
        border-radius: 0;
        border-left: none;
        border-right: none;
        aspect-ratio: 16/9;
      }
      .room-card:hover { transform: none; }
    }
    
    .room-preview-container {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      z-index: 0;
    }

    .room-preview {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      background-size: cover;
      background-position: center;
      opacity: 0;
      z-index: 0;
      pointer-events: none;
      transition: opacity 1.5s ease-in-out, transform 6s ease-in-out;
      transform: scale(1);
    }

    .room-preview.active {
      opacity: 0.6;
      transform: scale(1.08);
    }

    .room-card:hover .room-preview.active {
      opacity: 0.8;
    }

    .no-preview {
      display: flex; align-items: center; justify-content: center; height: 100%;
      background: #1e293b; color: rgba(255,255,255,0.2); font-size: 0.8rem; font-weight: 600;
    }

    .room-overlay {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      background: linear-gradient(to top, rgba(15, 23, 42, 0.9) 0%, rgba(15, 23, 42, 0.2) 60%);
      z-index: 1;
    }

    .room-content-wrapper {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      padding: 2rem;
      width: 100%;
      color: white;
    }

    .room-info h3 { margin: 0; font-size: 1.75rem; font-weight: 800; color: white; letter-spacing: -0.02em; }
    .room-info p { margin: 0.4rem 0 1rem 0; opacity: 0.5; font-size: 0.9rem; color: white; font-weight: 500; }
    .derivation-hint { font-size: 0.8em; font-style: italic; opacity: 0.7; }
  `]
})
export class RoomCardComponent {
  @Input() room: any;
  @Input() images: string[] = [];
  @Input() currentImageIndex: number = 0;
}
