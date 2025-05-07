// app.routes.ts
/**
 * Application Routes Configuration
 * 
 * Defines all the routes in the application and their corresponding components.
 * Uses lazy loading for better performance - components are only loaded when needed.
 * The authGuard protects routes that require authentication.
 * 
 * Route parameters are automatically bound to @Input properties with the same name
 * in components thanks to withComponentInputBinding().
 */
import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  // Public route - accessible without authentication
  { 
    path: 'login', 
    loadComponent: () => import('./components/login/login.component')
      .then(c => c.LoginPageComponent) 
  },
  
  // Protected routes - require authentication
  { 
    path: 'dashboard', 
    loadComponent: () => import('./components/dashboard/dashboard.component')
      .then(c => c.DashboardPageComponent),
    canActivate: [authGuard] // Prevents access if not logged in
  },
  { 
    path: 'profile', 
    loadComponent: () => import('./components/profile/profile.component')
      .then(c => c.ProfilePageComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'calendar', 
    loadComponent: () => import('./components/calendar-view/calendar-view.component')
      .then(c => c.CalendarPageComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'cycle/add', 
    loadComponent: () => import('./components/cycle-form/cycle-form.component')
      .then(c => c.CycleFormPageComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'cycle/edit/:cycle_id', // Parameter name matches @Input property in component
    loadComponent: () => import('./components/cycle-form/cycle-form.component')
      .then(c => c.CycleFormPageComponent),
    canActivate: [authGuard]
  },
  
  // Default routes
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' }, // Empty path redirects to dashboard
  { path: '**', redirectTo: '/dashboard' } // Catch-all for any undefined routes
];