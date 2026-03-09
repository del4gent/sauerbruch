import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="stat-item transparent" [routerLink]="link">
      <span class="stat-label">{{ label }}</span>
      <div class="progress-container" *ngIf="progress !== undefined">
        <div class="progress-bar" [style.width.%]="progress"></div>
      </div>
      <span class="stat-value">{{ value }}</span>
    </div>
  `,
  styles: [`
    .stat-item { 
      padding: 1.75rem; 
      display: flex; 
      flex-direction: column; 
      cursor: pointer; 
      transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      border-radius: 24px;
      height: 100%;
    }

    @media (max-width: 768px) {
      .stat-item {
        padding: 1.25rem;
        border-radius: 16px;
      }
    }
    .stat-item.transparent {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(12px);
    }
    .stat-item:hover { 
      transform: translateY(-10px); 
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.2);
    }
    .stat-label { 
      font-size: 0.7rem; 
      text-transform: uppercase; 
      letter-spacing: 0.15em; 
      color: white; 
      font-weight: 800; 
      margin-bottom: 1.25rem; 
      opacity: 0.5;
    }
    .stat-value { 
      font-size: 2.25rem; 
      font-weight: 800; 
      color: white; 
      line-height: 1;
      letter-spacing: -0.02em;
    }

    .progress-container { background: rgba(255, 255, 255, 0.1); height: 6px; border-radius: 3px; margin: 0.5rem 0 1.25rem 0; overflow: hidden; }
    .progress-bar { 
      background: #fff; 
      height: 100%; 
      border-radius: 3px; 
    }
  `]
})
export class StatCardComponent {
  @Input() label: string = '';
  @Input() value: string = '';
  @Input() progress?: number;
  @Input() link: string = '';
}
