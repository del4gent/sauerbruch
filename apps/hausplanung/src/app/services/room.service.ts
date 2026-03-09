import { Injectable, signal, computed, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs/operators';
import roomsData from '../../../public/assets/data/rooms.json';
import imagesData from '../../../public/assets/data/images.json';

export interface Room {
  id: string;
  name: string;
  area: number;
  area_derivation: string;
  status: 'In Planung' | 'In Arbeit' | 'Pausiert' | 'Fertig';
  budget: number | null;
  path: string;
}

@Injectable({
  providedIn: 'root'
})
export class RoomService {
  private rooms = signal<Room[]>(roomsData as Room[]);
  
  isAuthorized = signal(false);
  isSidebarCollapsed = signal(true);
  isOtherRoomsExpanded = signal(false);
  breadcrumbTitle = signal<string | null>(null);

  private statusOrder: Record<string, number> = {
    'In Arbeit': 1,
    'In Planung': 2,
    'Pausiert': 3,
    'Fertig': 4
  };

  activeRooms = computed(() => 
    [...this.rooms()]
      .filter(r => r.status === 'In Planung' || r.status === 'In Arbeit')
      .sort((a, b) => (this.statusOrder[a.status] || 99) - (this.statusOrder[b.status] || 99))
  );

  otherRooms = computed(() => 
    [...this.rooms()]
      .filter(r => r.status !== 'In Planung' && r.status !== 'In Arbeit')
      .sort((a, b) => (this.statusOrder[a.status] || 99) - (this.statusOrder[b.status] || 99))
  );

  sortedRooms = computed(() => 
    [...this.rooms()].sort((a, b) => (this.statusOrder[a.status] || 99) - (this.statusOrder[b.status] || 99))
  );

  totalArea = computed(() => this.rooms().reduce((acc, r) => acc + r.area, 0));
  totalBudget = computed(() => this.rooms().reduce((acc, r) => acc + (r.budget || 0), 0));

  private roomImagesMap: Record<string, string[]> = imagesData as Record<string, string[]>;

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

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateBreadcrumb();
    });
  }

  getRooms(): Room[] {
    return this.sortedRooms();
  }

  getRoomById(id: string): Room | undefined {
    return this.rooms().find(r => r.id === id);
  }

  getRoomImages(id: string): string[] {
    return this.roomImagesMap[id] || [];
  }

  getRoomInspirationImages(id: string): string[] {
    const images = this.getRoomImages(id);
    return images.filter(img => img.includes('/inspiration/'));
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
      const room = this.getRoomById(roomId || '');
      this.breadcrumbTitle.set(room ? room.name : 'Raum');
    } else if (path.includes('/details/area')) {
      this.breadcrumbTitle.set('Flächen');
    } else if (path.includes('/details/budget')) {
      this.breadcrumbTitle.set('Materialkosten');
    } else if (path.includes('/details/progress')) {
      this.breadcrumbTitle.set('Status');
    } else {
      this.breadcrumbTitle.set('Planung');
    }
  }

  checkPassword(input: string) {
    const value = input.trim().toLowerCase();
    if (value === 'bubu' || value === 'sauerbruch') {
      this.isAuthorized.set(true);
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem('auth', 'bubu');
      }
    }
  }

  toggleSidebar() {
    this.isSidebarCollapsed.update((v) => !v);
  }

  toggleOtherRooms() {
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
