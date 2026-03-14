import { computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';

import {
  getActiveRooms,
  getOtherRooms,
  resolveBreadcrumbTitle,
  sortRoomsByStatus,
} from '../shared/hausplanung.constants';
import { Material, Room } from '../shared/hausplanung.models';
import {
  INITIAL_IMAGE_METADATA_MAP,
  INITIAL_ROOM_IMAGES_MAP,
  INITIAL_ROOM_MATERIALS_MAP,
  INITIAL_ROOMS,
} from '../shared/static-room-data';

type RoomState = {
  rooms: Room[];
  isAuthorized: boolean;
  isSidebarCollapsed: boolean;
  isOtherRoomsExpanded: boolean;
  breadcrumbTitle: string | null;
  roomImagesMap: Record<string, string[]>;
  imageMetadataMap: Record<string, string>;
  roomMaterialsMap: Record<string, Material[]>;
};

const initialState: RoomState = {
  rooms: INITIAL_ROOMS,
  isAuthorized: true,
  isSidebarCollapsed: true,
  isOtherRoomsExpanded: false,
  breadcrumbTitle: null,
  roomImagesMap: INITIAL_ROOM_IMAGES_MAP,
  imageMetadataMap: INITIAL_IMAGE_METADATA_MAP,
  roomMaterialsMap: INITIAL_ROOM_MATERIALS_MAP,
};

export const RoomStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ rooms }) => ({
    sortedRooms: computed(() => sortRoomsByStatus(rooms())),
    activeRooms: computed(() => getActiveRooms(rooms())),
    otherRooms: computed(() => getOtherRooms(rooms())),
    totalArea: computed(() =>
      rooms()
        .filter((room) => room.id !== 'dach')
        .reduce((acc, room) => acc + room.area, 0)
    ),
    totalBudget: computed(() => rooms().reduce((acc, room) => acc + (room.budget || 0), 0)),
  })),
  withMethods((store) => {
    const router = inject(Router);
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
      getImageDate(url: string): string | null {
        return store.imageMetadataMap()[url] || null;
      },
      getRoomMaterials(id: string): Material[] {
        return store.roomMaterialsMap()[id] || [];
      },
      getRoomInspirationImages(id: string): string[] {
        const images = store.roomImagesMap()[id] || [];
        return images.filter(img => img.includes('/inspiration/'));
      },
      getRoomDisplayImages(id: string): string[] {
        const images = store.roomImagesMap()[id] || [];
        const inspiration = images.filter((img) => img.includes('/inspiration/'));
        if (inspiration.length > 0) {
          return inspiration;
        }
        return images.filter((img) => img.includes('/ist/'));
      },
      updateBreadcrumb() {
        patchState(store, {
          breadcrumbTitle: resolveBreadcrumbTitle(router.url, store.rooms()),
        });
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
        const room = store.rooms().find((item) => item.id === roomId);
        return room?.emoji || '🏠';
      },
    };
  })
);
