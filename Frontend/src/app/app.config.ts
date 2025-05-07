// app.config.ts
/**
 * Application Configuration - Provides core services to the Angular app
 * 
 * This file configures:
 * - The router with route parameter binding
 * - HTTP client with interceptors for authentication
 * - Browser animations for UI effects
 * 
 * It sets up the global dependencies needed by the application.
 */
import { ApplicationConfig } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { authInterceptor } from './interceptors/auth.interceptor';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    // Configure routing with route parameter binding
    // (makes route params available as @Input properties)
    provideRouter(routes, withComponentInputBinding()),
    
    // Configure HTTP client with auth interceptor
    // (automatically adds auth headers to requests)
    provideHttpClient(withInterceptors([authInterceptor])),
    
    // Enable Angular animations system
    provideAnimations()
  ]
};