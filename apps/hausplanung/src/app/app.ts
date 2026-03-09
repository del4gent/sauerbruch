import { Component, Inject, OnInit, PLATFORM_ID, signal, computed } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { filter, map } from 'rxjs/operators';
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
  isAuthorized = signal(false);
  isSidebarCollapsed = signal(true);
  isOtherRoomsExpanded = signal(false);
  
  // Breadcrumb logic
  breadcrumbTitle = signal<string | null>(null);

  private statusOrder: Record<string, number> = {
    'In Arbeit': 1,
    'In Planung': 2,
    'Pausiert': 3,
    'Fertig': 4
  };

  // Filtered rooms: Active planning (In Planung, In Arbeit) vs Others, both sorted
  activeRooms = computed(() => 
    [...this.rooms]
      .filter(r => r.status === 'In Planung' || r.status === 'In Arbeit')
      .sort((a, b) => (this.statusOrder[a.status] || 99) - (this.statusOrder[b.status] || 99))
  );

  otherRooms = computed(() => 
    [...this.rooms]
      .filter(r => r.status !== 'In Planung' && r.status !== 'In Arbeit')
      .sort((a, b) => (this.statusOrder[a.status] || 99) - (this.statusOrder[b.status] || 99))
  );

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {
    if (isPlatformBrowser(this.platformId)) {
      const auth = localStorage.getItem('auth');
      if (auth === 'bubu') {
        this.isAuthorized.set(true);
      }
    }

    // Listen to route changes to update breadcrumb
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateBreadcrumb();
    });
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      document.body.setAttribute('data-theme', 'light');
      this.updateBreadcrumb();

      // Check for 'invite=sauerbruch' in URL query parameters (magic link)
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('invite') === 'sauerbruch') {
        this.isAuthorized.set(true);
        localStorage.setItem('auth', 'bubu');
      }
    }
  }

  updateBreadcrumb() {
    let route = this.activatedRoute.root;
    while (route.firstChild) {
      route = route.firstChild;
    }

    const path = this.router.url;
    
    if (path === '/' || path === '/dashboard') {
      this.breadcrumbTitle.set(null);
      return;
    }

    if (path.includes('/room/')) {
      const roomId = path.split('/').pop();
      const room = this.rooms.find(r => r.id === roomId);
      this.breadcrumbTitle.set(room ? room.name : 'Raum');
    } else if (path.includes('/details/area')) {
      this.breadcrumbTitle.set('Flächen');
    } else if (path.includes('/details/budget')) {
      this.breadcrumbTitle.set('Budget');
    } else if (path.includes('/details/progress')) {
      this.breadcrumbTitle.set('Status');
    } else {
      this.breadcrumbTitle.set('Planung');
    }
  }

  checkPassword(eventOrValue: Event | string) {
    const value = typeof eventOrValue === 'string' 
      ? eventOrValue 
      : (eventOrValue.target as HTMLInputElement).value;
      
    const input = value.trim().toLowerCase();
    if (input === 'bubu' || input === 'sauerbruch') {
      this.isAuthorized.set(true);
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem('auth', 'bubu');
      }
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
