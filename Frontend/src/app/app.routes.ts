// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/login-page/login-page.component').then(c => c.LoginPageComponent) },
  { 
    path: 'dashboard', 
    loadComponent: () => import('./pages/dashboard-page/dashboard-page.component').then(c => c.DashboardPageComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'profile', 
    loadComponent: () => import('./pages/profile-page/profile-page.component').then(c => c.ProfilePageComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'calendar', 
    loadComponent: () => import('./pages/calendar-page/calendar-page.component').then(c => c.CalendarPageComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'cycle/add', 
    loadComponent: () => import('./pages/cycle-form-page/cycle-form-page.component').then(c => c.CycleFormPageComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'cycle/edit/:cycle_id', 
    loadComponent: () => import('./pages/cycle-form-page/cycle-form-page.component').then(c => c.CycleFormPageComponent),
    canActivate: [authGuard]
  },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: '/dashboard' }
];