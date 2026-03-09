import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  { 
    path: '', 
    loadComponent: () => import('./dashboard/dashboard').then(m => m.DashboardComponent) 
  },
  { 
    path: 'room/:room', 
    loadComponent: () => import('./room/room').then(m => m.RoomComponent) 
  },
  {
    path: 'details/budget',
    loadComponent: () => import('./details/budget/budget').then(m => m.BudgetComponent)
  },
  {
    path: 'details/area',
    loadComponent: () => import('./details/area/area').then(m => m.AreaComponent)
  },
  {
    path: 'details/progress',
    loadComponent: () => import('./details/progress/progress').then(m => m.ProgressComponent)
  }
];
