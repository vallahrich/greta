/**
 * Authentication Interceptor - Handles HTTP request/response processing
 * 
 * This interceptor:
 * - Automatically adds auth tokens to outgoing HTTP requests
 * - Handles 401 Unauthorized responses by logging the user out
 * - Skips authentication for login/register endpoints
 * 
 * It's registered in app.config.ts and intercepts all HTTP requests.
 */
import { HttpInterceptorFn, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  
  // Skip adding auth header for login/register requests
  // (These endpoints don't require authentication)
  if (req.url.includes('/auth/login') || req.url.includes('/auth/register')) {
    return next(req);
  }
  
  // Get auth header from localStorage
  const authHeader = localStorage.getItem('authHeader');
  
  // If auth header exists, add it to the request
  if (authHeader) {
    const authRequest = req.clone({
      headers: req.headers.set('Authorization', authHeader)
    });
    
    // Forward the modified request and handle errors
    return next(authRequest).pipe(
      catchError((error: HttpErrorResponse) => {
        // If server returns 401 Unauthorized, log the user out
        if (error.status === 401) {
          // Clear all auth data
          localStorage.removeItem('authHeader');
          localStorage.removeItem('currentUser');
          localStorage.removeItem('isAuthenticated');
          localStorage.removeItem('userEmail');
          localStorage.removeItem('userId');
          // Redirect to login page
          router.navigate(['/login']);
        }
        return throwError(() => error);
      })
    );
  }
  
  return next(req);
};