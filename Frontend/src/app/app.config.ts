import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { authInterceptor } from './interceptors/auth.interceptor';
import { routes } from './app.routes';

/**
 * ApplicationConfig object bootstraps core Angular providers for the app.
 * - provideRouter: sets up client-side routing based on defined routes
 * - provideHttpClient: configures HttpClient with global interceptors
 * - provideAnimations: activates Angular's animation engine
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, ),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimations()
  ]
};