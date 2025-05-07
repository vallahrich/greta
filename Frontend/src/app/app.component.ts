// app.component.ts
/**
 * Root Component - The main container for the PeriodTracker application
 * 
 * This component serves as the entry point for the application. It:
 * - Hosts the router outlet where all page components are displayed
 * - Provides the main layout container
 * - Gets bootstrapped in main.ts as the application root
 */
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';

@Component({
  selector: 'app-root', // The HTML element that hosts this component
  standalone: true, // Angular 17+ standalone component (no NgModule needed)
  imports: [CommonModule, RouterOutlet, RouterModule], // Required dependencies
  templateUrl: './app.component.html', // HTML template
  styleUrl: './app.component.css' // CSS styles
})
export class AppComponent {
  // Application title - could be used in headers, browser title, etc.
  title = 'FlowelleAng'; 
}