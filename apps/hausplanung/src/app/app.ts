import { Component, Inject, OnInit, PLATFORM_ID, signal, computed } from '@angular/core';
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
  isOtherRoomsExpanded = signal(false);

  // Filtered rooms: Active planning (In Planung, Angefangen) vs Others
  activeRooms = computed(() => 
    this.rooms.filter(r => r.status === 'In Planung' || r.status === 'Angefangen')
  );

  otherRooms = computed(() => 
    this.rooms.filter(r => r.status !== 'In Planung' && r.status !== 'Angefangen')
  );

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.applyTheme();

      // Check for 'invite=sauerbruch' in URL query parameters (magic link)
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('invite') === 'sauerbruch') {
        this.isAuthorized.set(true);
        localStorage.setItem('auth', 'bubu');
      }

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

  toggleOtherRooms(event: Event) {
    event.stopPropagation();
    this.isOtherRoomsExpanded.update(v => !v);
    if (this.isSidebarCollapsed()) {
      this.isSidebarCollapsed.set(false);
    }
  }

  getRoomEmoji(roomId: string): string {
    const emojis: Record<string, string> = {
      'flur': '🚪',
      'wohnraum': '🛋️',
      'essraum': '🍽️',
      'kueche': '🍳',
      'bad': '🚿',
      'wc': '🚽',
      'schlafzimmer': '🛏️',
      'kinderzimmer': '🧸',
      'zimmer': '💻',
      'flur_privat': '🗝️',
      'garderobe': '🧥',
      'garage': '🚗',
      'kellerflur': '📦',
      'keller_buero': '🖥️'
    };
    return emojis[roomId] || '🏠';
  }
}
