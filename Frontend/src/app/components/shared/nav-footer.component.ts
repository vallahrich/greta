/**
 * Navigation Footer Component - Provides consistent bottom navigation
 * 
 * This reusable component:
 * - Displays standard navigation options across the app
 * - Highlights the active route/section
 * - Provides easy access to primary app features
 * - Adapts to different screen sizes with responsive design
 */
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-nav-footer',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './nav-footer.component.html',
  styleUrls: ['./nav-footer.component.css']
})
export class NavFooterComponent {
  /**
   * Input to highlight the active route based on current page
   * Value should match one of the main navigation routes
   */
  @Input() activeRoute: 'dashboard' | 'calendar' | 'add-cycle' | 'profile' = 'dashboard';
}