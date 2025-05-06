import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ProfileComponent } from './components/profile/profile.component';
import { CalendarViewComponent } from './components/calendar-view/calendar-view.component';
import { CycleFormComponent } from './components/cycle-form/cycle-form.component';
import { LoginComponent } from './components/login/login.component';
import { AuthGuard } from './guards/auth.guard';

/**
 * Application routes configuration:
 * Defines URL paths, associated components, and route guards.
 */

export const routes: Routes = [
  { path: 'login', component: LoginComponent }, // Public route: no auth guard, accessible to all users
  { 
    path: 'dashboard', 
    component: DashboardComponent,
    canActivate: [AuthGuard]// Only allow authenticated users
  },
  { 
    path: 'profile', 
    component: ProfileComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'calendar', 
    component: CalendarViewComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'cycle/add', 
    component: CycleFormComponent,
    canActivate: [AuthGuard]
  },

  // Edit form reuses CycleFormComponent; :cycle_id param identifies which cycle to load
  { 
    path: 'cycle/edit/:cycle_id', 
    component: CycleFormComponent,
    canActivate: [AuthGuard]
  },
  // Default route: redirect to dashboard
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: '/dashboard' }
];