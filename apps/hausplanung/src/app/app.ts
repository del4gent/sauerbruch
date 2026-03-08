import { Component, Inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import roomsData from '../../public/assets/data/rooms.json';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  rooms = roomsData;
  isDarkMode = signal(true);

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const savedTheme = localStorage.getItem('theme');
      this.isDarkMode.set(savedTheme !== 'light');
      this.applyTheme();
    }
  }

  toggleTheme() {
    this.isDarkMode.update(v => !v);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('theme', this.isDarkMode() ? 'dark' : 'light');
      this.applyTheme();
    }
  }

  private applyTheme() {
    if (isPlatformBrowser(this.platformId)) {
      document.body.setAttribute('data-theme', this.isDarkMode() ? 'dark' : 'light');
    }
  }
}
