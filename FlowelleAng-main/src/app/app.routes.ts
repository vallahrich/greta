import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ProfileComponent } from './components/profile/profile.component';
import { CalendarViewComponent } from './components/calendar-view/calendar-view.component';
import { CycleFormComponent } from './components/cycle-form/cycle-form.component';
import { LoginComponent } from './components/login/login.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { 
    path: 'dashboard', 
    component: DashboardComponent,
    canActivate: [AuthGuard]
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
  { 
    path: 'cycle/edit/:cycle_id', 
    component: CycleFormComponent,
    canActivate: [AuthGuard]
  },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: '/dashboard' }
];