import { computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { signalStore, withState, withComputed, withMethods, withHooks, patchState } from '@ngrx/signals';
import roomsData from '../../../public/assets/data/rooms.json';
import imagesData from '../../../public/assets/data/images.json';
import materialsData from '../../../public/assets/data/materials.json';

export interface Material {
  id: string;
  name: string;
  brand: string;
  specs: string;
  image: string;
  status: 'In Auswahl' | 'Gekauft' | 'Ausgesucht';
  quantity: string;
  price: string;
  shop: string;
  link: string | null;
}

export interface Room {
  id: string;
  name: string;
  area: number;
  area_derivation: string;
  status: 'In Planung' | 'In Arbeit' | 'Pausiert' | 'Fertig';
  budget: number | null;
  path: string;
}

const statusOrder: Record<string, number> = {
  'In Arbeit': 1,
  'In Planung': 2,
  'Pausiert': 3,
  'Fertig': 4
};

const initialRooms = roomsData as Room[];
const initialImagesMap = imagesData as Record<string, string[]>;

type RoomState = {
  rooms: Room[];
  isAuthorized: boolean;
  isSidebarCollapsed: boolean;
  isOtherRoomsExpanded: boolean;
  breadcrumbTitle: string | null;
  roomImagesMap: Record<string, string[]>;
  roomMaterialsMap: Record<string, Material[]>;
};

const initialState: RoomState = {
  rooms: initialRooms,
  isAuthorized: false,
  isSidebarCollapsed: true,
  isOtherRoomsExpanded: false,
  breadcrumbTitle: null,
  roomImagesMap: initialImagesMap,
  roomMaterialsMap: materialsData as Record<string, Material[]>
};

export const RoomStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ rooms }) => ({
    sortedRooms: computed(() => 
      [...rooms()].sort((a, b) => (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99))
    ),
    activeRooms: computed(() => 
      [...rooms()]
        .filter(r => r.status === 'In Planung' || r.status === 'In Arbeit')
        .sort((a, b) => (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99))
    ),
    otherRooms: computed(() => 
      [...rooms()]
        .filter(r => r.status !== 'In Planung' && r.status !== 'In Arbeit')
        .sort((a, b) => (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99))
    ),
    totalArea: computed(() => rooms().reduce((acc, r) => acc + r.area, 0)),
    totalBudget: computed(() => rooms().reduce((acc, r) => acc + (r.budget || 0), 0)),
  })),
  withMethods((store) => {
    const router = inject(Router);
    const activatedRoute = inject(ActivatedRoute);
    const platformId = inject(PLATFORM_ID);

    return {
      getRooms(): Room[] {
        return store.sortedRooms();
      },
      getRoomById(id: string): Room | undefined {
        return store.rooms().find(r => r.id === id);
      },
      getRoomImages(id: string): string[] {
        return store.roomImagesMap()[id] || [];
      },
      getRoomMaterials(id: string): Material[] {
        return store.roomMaterialsMap()[id] || [];
      },
      getRoomInspirationImages(id: string): string[] {
        const images = store.roomImagesMap()[id] || [];
        return images.filter(img => img.includes('/inspiration/'));
      },
      updateBreadcrumb() {
        let route = activatedRoute.root;
        while (route.firstChild) {
          route = route.firstChild;
        }
        const path = router.url;
        
        if (path === '/' || path === '/dashboard') {
          patchState(store, { breadcrumbTitle: null });
          return;
        }

        if (path.includes('/room/')) {
          const roomId = path.split('/').pop();
          const room = store.rooms().find(r => r.id === roomId);
          patchState(store, { breadcrumbTitle: room ? room.name : 'Raum' });
        } else if (path.includes('/details/area')) {
          patchState(store, { breadcrumbTitle: 'Flächen' });
        } else if (path.includes('/details/budget')) {
          patchState(store, { breadcrumbTitle: 'Materialkosten' });
        } else if (path.includes('/details/progress')) {
          patchState(store, { breadcrumbTitle: 'Status' });
        } else {
          patchState(store, { breadcrumbTitle: 'Planung' });
        }
      },
      checkPassword(input: string) {
        const value = input.trim().toLowerCase();
        if (value === 'bubu' || value === 'sauerbruch') {
          patchState(store, { isAuthorized: true });
          if (isPlatformBrowser(platformId)) {
            localStorage.setItem('auth', 'bubu');
          }
        }
      },
      toggleSidebar() {
        patchState(store, { isSidebarCollapsed: !store.isSidebarCollapsed() });
      },
      toggleOtherRooms() {
        patchState(store, { isOtherRoomsExpanded: !store.isOtherRoomsExpanded() });
        if (store.isSidebarCollapsed()) {
          patchState(store, { isSidebarCollapsed: false });
        }
      },
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
    };
  }),
  withHooks({
    onInit(store) {
      const platformId = inject(PLATFORM_ID);
      if (isPlatformBrowser(platformId)) {
        const auth = localStorage.getItem('auth');
        if (auth === 'bubu') {
          patchState(store, { isAuthorized: true });
        }
      }
    }
  })
);
