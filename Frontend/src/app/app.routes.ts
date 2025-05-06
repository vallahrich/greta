import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ProfileComponent } from './components/profile/profile.component';
import { CalendarViewComponent } from './components/calendar-view/calendar-view.component';
import { CycleFormComponent } from './components/cycle-form/cycle-form.component';
import { LoginComponent } from './components/login/login.component';
import { authGuard } from './guards/auth.guard'; // Changed from AuthGuard to authGuard

/**
 * Application routes configuration:
 * Defines URL paths, associated components, and route guards.
 */

export const routes: Routes = [
  { path: 'login', component: LoginComponent }, // Public route: no auth guard, accessible to all users
  { 
    path: 'dashboard', 
    component: DashboardComponent,
    canActivate: [authGuard]// Changed from AuthGuard to authGuard
  },
  { 
    path: 'profile', 
    component: ProfileComponent,
    canActivate: [authGuard] // Changed from AuthGuard to authGuard
  },
  { 
    path: 'calendar', 
    component: CalendarViewComponent,
    canActivate: [authGuard] // Changed from AuthGuard to authGuard
  },
  { 
    path: 'cycle/add', 
    component: CycleFormComponent,
    canActivate: [authGuard] // Changed from AuthGuard to authGuard
  },
  { 
    path: 'cycle/edit/:cycle_id', 
    component: CycleFormComponent,
    canActivate: [authGuard] // Changed from AuthGuard to authGuard
  },
  // Default route: redirect to dashboard
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: '/dashboard' }
];