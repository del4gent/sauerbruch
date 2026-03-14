import { MaterialStatus, Milestone, Room, RoomStatus } from './hausplanung.models';

export const ROOM_STATUS_ORDER: Record<RoomStatus, number> = {
  'In Arbeit': 1,
  'In Planung': 2,
  Pausiert: 3,
  Fertig: 4,
};

export const MATERIAL_STATUS_ORDER: Record<MaterialStatus, number> = {
  Gekauft: 1,
  Ausgesucht: 2,
  'In Auswahl': 3,
};

export const ROOM_MILESTONES: Milestone[] = [
  { name: 'Datenaufnahme & Maße (m²)', done: true },
  { name: 'Erstellung Leistungsverzeichnis', done: true },
  { name: 'Angebote Handwerker einholen', done: false },
  { name: 'Austausch der Fenster', done: false },
  { name: 'Bestellung Material', done: false },
  { name: 'Entkernung Bad', done: false },
  { name: 'Installation Elektro', done: false },
  { name: 'Installation Sanitär', done: false },
  { name: 'Fliesenarbeiten', done: false },
  { name: 'Montage Endgeräte', done: false },
  { name: 'Finale Abnahme', done: false },
];

const ACTIVE_ROOM_STATUSES: RoomStatus[] = ['In Planung', 'In Arbeit'];

const DETAIL_BREADCRUMBS: Record<string, string> = {
  '/details/area': 'Flächen',
  '/details/budget': 'Materialkosten',
  '/details/progress': 'Status',
};

export function sortRoomsByStatus(rooms: Room[]): Room[] {
  return [...rooms].sort(
    (a, b) => (ROOM_STATUS_ORDER[a.status] ?? 99) - (ROOM_STATUS_ORDER[b.status] ?? 99)
  );
}

export function getActiveRooms(rooms: Room[]): Room[] {
  return sortRoomsByStatus(rooms.filter((room) => ACTIVE_ROOM_STATUSES.includes(room.status)));
}

export function getOtherRooms(rooms: Room[]): Room[] {
  return sortRoomsByStatus(rooms.filter((room) => !ACTIVE_ROOM_STATUSES.includes(room.status)));
}

export function calculateMilestoneProgress(milestones: Milestone[]): number {
  if (milestones.length === 0) {
    return 0;
  }

  const doneCount = milestones.filter((milestone) => milestone.done).length;
  return Math.round((doneCount / milestones.length) * 100);
}

export function resolveBreadcrumbTitle(path: string, rooms: Room[]): string | null {
  if (path === '/' || path === '/dashboard') {
    return null;
  }

  if (path.includes('/room/')) {
    const roomId = path.split('/').pop();
    return rooms.find((room) => room.id === roomId)?.name ?? 'Raum';
  }

  return DETAIL_BREADCRUMBS[path] ?? 'Planung';
}

export function getStatusBadgeClass(
  status: string,
  variant: 'auto' | 'done' | 'pending' = 'auto'
): string {
  if (variant === 'done') return 'status-done';
  if (variant === 'pending') return 'status-pending';

  switch (status) {
    case 'In Arbeit':
    case 'Angefangen':
      return 'status-active';
    case 'In Planung':
      return 'status-planned';
    case 'Fertig':
      return 'status-finished';
    case 'Pausiert':
      return 'status-paused';
    default:
      return 'status-planned';
  }
}

export function getMaterialStatusClass(status: string): string {
  const normalizedStatus = status.trim().toLowerCase();

  if (normalizedStatus === 'gekauft') return 'gekauft';
  if (normalizedStatus === 'ausgesucht') return 'ausgesucht';
  if (normalizedStatus === 'in auswahl') return 'noch-aussuchen';

  return '';
}
