// src/app/interceptors/auth.interceptor.ts
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

/**
 * Auth interceptor to add authorization headers to outgoing requests
 * and handle unauthorized responses
 */
export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  
  // Skip adding auth header for login/register requests
  if (req.url.includes('/api/auth/login') || 
      req.url.includes('/api/auth/register') || 
      req.url.includes('/api/user/exists/')) {
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
        // Handle 401 Unauthorized errors
        if (error.status === 401) {
          // Clear auth data
          localStorage.removeItem('authHeader');
          localStorage.removeItem('isAuthenticated');
          localStorage.removeItem('userEmail');
          localStorage.removeItem('userId');
          localStorage.removeItem('userName');
          localStorage.removeItem('tokenExpiration');
          
          // Redirect to login
          router.navigate(['/login'], { 
            queryParams: { unauthorized: true }
          });
        }
        
        return throwError(() => error);
      })
    );
  }
  
  // If no auth header, just forward the request as is
  return next(req);
};