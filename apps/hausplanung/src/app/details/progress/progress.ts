import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { StatusBadgeComponent } from '../../ui/status-badge/status-badge.component';
import { calculateMilestoneProgress, ROOM_MILESTONES } from '../../shared/hausplanung.constants';

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [CommonModule, RouterModule, StatusBadgeComponent],
  templateUrl: './progress.html',
  styleUrl: './progress.css'
})
export class ProgressComponent {
  readonly milestones = ROOM_MILESTONES;

  doneCount = signal(this.milestones.filter((milestone) => milestone.done).length);

  calculateProgress() {
    return calculateMilestoneProgress(this.milestones);
  }
}
