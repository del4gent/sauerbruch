import { SafeHtml } from '@angular/platform-browser';

export type RoomStatus = 'In Planung' | 'In Arbeit' | 'Pausiert' | 'Fertig';
export type MaterialStatus = 'In Auswahl' | 'Gekauft' | 'Ausgesucht';

export interface Material {
  id: string;
  name: string;
  brand: string;
  specs: string;
  image: string;
  status: MaterialStatus;
  quantity: string;
  price: string;
  shop: string;
  link: string | null;
}

export interface Room {
  id: string;
  name: string;
  emoji: string;
  area: number;
  area_derivation: string;
  status: RoomStatus;
  budget: number | null;
  path: string;
}

export interface ChecklistItem {
  label: string;
  done: boolean;
}

export interface TableData {
  headers: string[];
  rows: string[][];
}

export interface RoomSection {
  title: string;
  type: 'checklist' | 'table' | 'text';
  items: ChecklistItem[] | TableData | string;
  html?: SafeHtml;
}

export interface RoomData {
  title: string;
  basisdaten: {
    flaeche: string;
    herleitung: string;
    status: string;
  };
  sections: RoomSection[];
}

export interface ImageGroup {
  id: 'plan' | 'soll' | 'material' | 'ist';
  label: string;
  icon: string;
  images: string[];
  materials?: Material[];
}

export interface RoomProgress {
  total: number;
  completed: number;
  percentage: number;
  upcomingTasks: string[];
}

export interface RoomMediaState {
  heroImage: string | null;
  beforeImage: string | null;
  afterImage: string | null;
}

export interface Milestone {
  name: string;
  done: boolean;
}
