/**
 * Auth interceptor to add authorization headers to outgoing requests
 * and handle unauthorized responses
 */

import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  
  // Debug logging
  console.log(`Request URL: ${req.url}`);
  
  // Skip adding auth header for login/register requests
  if (req.url.includes('/auth/login') || req.url.includes('/auth/register')) {
    console.log('Skipping auth header for auth endpoint');
    return next(req);
  }
  
  // Get auth header from localStorage
  const authHeader = localStorage.getItem('authHeader');
  
  // If auth header exists, add it to the request
  if (authHeader) {
    console.log('Adding auth header to request');
    const authRequest = req.clone({
      headers: req.headers.set('Authorization', authHeader)
    });
    
    // Forward the modified request and handle errors
    return next(authRequest).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          console.log('401 Unauthorized response - logging out');
          localStorage.removeItem('authHeader');
          localStorage.removeItem('currentUser');
          localStorage.removeItem('isAuthenticated');
          localStorage.removeItem('userEmail');
          localStorage.removeItem('userId');
          router.navigate(['/login']);
        }
        return throwError(() => error);
      })
    );
  }
  
  console.log('No auth header found for request');
  return next(req);
};