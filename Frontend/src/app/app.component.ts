import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';

/**
 * Root component for the PeriodTracker Angular application.
 * - Bootstrapped in main.ts
 * - Hosts the <router-outlet> for displaying routed views
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  //Application title used in the main layout or header
  title = 'FlowelleAng'; 
}