import {Routes} from '@angular/router';
import {authGuard} from './core/auth/auth.guard';
import {Layout} from './layout/layout';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'InventarBuddy',
    loadComponent: () => import('./pages/landing/landing').then((m) => m.Landing),
  },
  {
    path: '',
    component: Layout,
    canActivateChild: [authGuard],
    children: [
      {
        path: 'dashboard',
        title: 'Dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'items',
        title: 'Gegenstände',
        loadComponent: () => import('./pages/items/items').then((m) => m.Items),
      },
      {
        path: 'categories',
        title: 'Kategorien',
        loadComponent: () => import('./pages/categories/categories').then((m) => m.Categories),
      },
      {
        path: 'storages',
        title: 'Lagerorte',
        loadComponent: () => import('./pages/storages/storages').then((m) => m.Storages),
      },
      {
        path: 'profile',
        title: 'Mein Profil',
        loadComponent: () => import('./pages/profile/profile').then((m) => m.Profile),
      },
      {
        path: 'media',
        title: 'Medien',
        loadComponent: () => import('./pages/media/media').then((m) => m.Media),
      },
    ],
  },
  {path: '**', redirectTo: ''},
];
