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
  isDarkMode = signal(false);
  isAuthorized = signal(false);
  isSidebarCollapsed = signal(true);

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.applyTheme();

      const auth = localStorage.getItem('auth');
      if (auth === 'bubu') {
        this.isAuthorized.set(true);
      }
    }
  }

  checkPassword(event: Event) {
    const input = (event.target as HTMLInputElement).value;
    if (input === 'bubu') {
      this.isAuthorized.set(true);
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem('auth', 'bubu');
      }
    }
  }

  private applyTheme() {
    if (isPlatformBrowser(this.platformId)) {
      document.body.setAttribute('data-theme', this.isDarkMode() ? 'dark' : 'light');
    }
  }

  toggleSidebar() {
    this.isSidebarCollapsed.update((v) => !v);
  }
}
