import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  { 
    path: '', 
    loadComponent: () => import('./nx-welcome').then(m => m.NxWelcomeComponent) 
  },
  { 
    path: 'room/:room', 
    loadComponent: () => import('./room/room').then(m => m.RoomComponent) 
  }
];
