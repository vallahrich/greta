import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * AuthGuard protects routes from unauthorized access.
 * Applied via canActivate in route definitions, it checks if the user
 * is currently authenticated. If not, it redirects to the login page.
 */

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (this.authService.isAuthenticated) {
      return true;
    }
    
    this.router.navigate(['/login']);
    return false;
  }
}