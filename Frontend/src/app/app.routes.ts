// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./components/login/login.component').then(c => c.LoginPageComponent) },
  { 
    path: 'dashboard', 
    loadComponent: () => import('./components/dashboard/dashboard.component').then(c => c.DashboardPageComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'profile', 
    loadComponent: () => import('./components/profile/profile.component').then(c => c.ProfilePageComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'calendar', 
    loadComponent: () => import('./components/calendar-view/calendar-view.component').then(c => c.CalendarPageComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'cycle/add', 
    loadComponent: () => import('./components/cycle-form/cycle-form.component').then(c => c.CycleFormPageComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'cycle/edit/:cycle_id', 
    loadComponent: () => import('./components/cycle-form/cycle-form.component').then(c => c.CycleFormPageComponent),
    canActivate: [authGuard]
  },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: '/dashboard' }
];