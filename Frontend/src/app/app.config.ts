import { ApplicationConfig } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { authInterceptor } from './interceptors/auth.interceptor';
import { routes } from './app.routes';

/**
 * ApplicationConfig object bootstraps core Angular providers for the app.
 * - provideRouter: sets up client-side routing based on defined routes
 *   - withComponentInputBinding: enables route parameter to component @Input binding
 * - provideHttpClient: configures HttpClient with global interceptors
 * - provideAnimations: activates Angular's animation engine
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimations()
  ]
};