import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

/**
 * Entry point for the Angular application.
 * Uses the standalone `bootstrapApplication` API to initialize the root component and providers defined in appConfig.
 */

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));