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
      padding: 1.25rem 1.5rem; 
      display: flex; 
      flex-direction: column; 
      cursor: pointer; 
      transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      border-radius: 20px;
      height: 100%;
    }

    @media (max-width: 768px) {
      .stat-item {
        padding: 0.75rem 1rem;
        border-radius: 12px;
      }
      .stat-label {
        font-size: 0.55rem;
        margin-bottom: 0.4rem;
      }
      .stat-value {
        font-size: 1.25rem;
      }
      .progress-container {
        height: 3px;
        margin-bottom: 0.6rem;
      }
    }
    .stat-item.transparent {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
    }
    .stat-item:hover { 
      transform: translateY(-8px); 
      background: rgba(255, 255, 255, 0.15);
      border-color: rgba(255, 255, 255, 0.3);
      box-shadow: 0 20px 40px rgba(0,0,0,0.2);
    }
    .stat-label { 
      font-size: 0.65rem; 
      text-transform: uppercase; 
      letter-spacing: 0.12em; 
      color: white; 
      font-weight: 800; 
      margin-bottom: 1rem; 
      opacity: 0.5;
    }
    .stat-value { 
      font-size: 1.75rem; 
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
