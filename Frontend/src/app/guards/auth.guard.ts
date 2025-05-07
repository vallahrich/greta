/**
 * Auth Guard - Protects routes from unauthorized access
 * 
 * This guard:
 * - Checks if the user is authenticated before allowing route access
 * - Redirects to login page if authentication fails
 * - Preserves the attempted URL for redirect after login
 * 
 * Uses the functional guard pattern introduced in Angular 14+.
 */
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Functional route guard that checks authentication status
export const authGuard: CanActivateFn = (route, state) => {
  // Use dependency injection to get required services
  const router = inject(Router);
  const authService = inject(AuthService);
  
  // Check if user is authenticated
  if (authService.isAuthenticated()) {
    // Allow access to the route
    return true;
  }
  
  // Not authenticated - redirect to login page with return URL
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};