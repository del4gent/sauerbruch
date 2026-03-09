import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { StatusBadgeComponent } from '../../ui/status-badge/status-badge.component';

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [CommonModule, RouterModule, StatusBadgeComponent],
  templateUrl: './progress.html',
  styleUrl: './progress.css'
})
export class ProgressComponent {
  milestones = [
    { name: 'Datenaufnahme & Maße (m²)', done: true },
    { name: 'Erstellung Leistungsverzeichnis', done: true },
    { name: 'Angebote Handwerker einholen', done: false },
    { name: 'Austausch der Fenster (Lieferung & Montage)', done: false },
    { name: 'Bestellung Material', done: false },
    { name: 'Entkernung Bad', done: false },
    { name: 'Installation Elektro', done: false },
    { name: 'Installation Sanitär', done: false },
    { name: 'Fliesenarbeiten', done: false },
    { name: 'Montage Endgeräte', done: false },
    { name: 'Finale Abnahme', done: false }
  ];

  doneCount = signal(this.milestones.filter(m => m.done).length);
  
  calculateProgress() {
    return Math.round((this.doneCount() / this.milestones.length) * 100);
  }
}
