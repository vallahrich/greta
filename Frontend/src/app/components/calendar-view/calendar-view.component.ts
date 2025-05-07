/**
 * Calendar Component - Visual calendar view of period cycles
 * 
 * This component provides:
 * - Monthly calendar view of period days
 * - Visual indicators for period, fertile window, and ovulation
 * - Month navigation to view past/future months
 * - Color-coded legend
 * 
 * It visualizes the period tracking data in a familiar calendar format.
 */
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';

import { PeriodCycleService } from '../../services/periodcycle.service';
import { Periodcycle } from '../../models/Periodcycle';
import { AuthService } from '../../services/auth.service';
import { NavFooterComponent } from '../shared/nav-footer.component';

/**
 * Interface for calendar day cells
 * Contains rendering state and cycle data
 */
interface CalendarDay {
  day: number | null;       // Day number or null for empty cells
  date: Date | null;        // Actual date object or null
  active: boolean;          // Any special status (period/fertile/etc)
  isPeriod: boolean;        // Is a period day
  isFertile: boolean;       // Is in fertile window
  isOvulation: boolean;     // Is ovulation day
  isToday: boolean;         // Is today's date
  cycleId?: number;         // Associated cycle ID if any
}

@Component({
  selector: 'app-calendar-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatMenuModule,
    NavFooterComponent
  ],
  templateUrl: './calendar-view.component.html',
  styleUrls: ['./calendar-view.component.css']
})
export class CalendarPageComponent implements OnInit {
  // Date tracking
  currentDate: Date = new Date();      // Current displayed month
  currentMonth: string = '';           // Formatted month/year label
  currentYear: number = 0;             // Displayed year

  // Calendar data
  weekDays = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']; // Day headers
  monthDays: CalendarDay[] = [];       // Grid cell data

  // User data
  userId: number | null = null;       // Authenticated user ID
  cycleData: Periodcycle[] = [];      // User's cycle records
  
  // UI state
  isLoading = false;                  // Controls spinner
  errorMessage = '';                  // Displays errors

  constructor(
    private router: Router,
    private periodCycleService: PeriodCycleService,
    private authService: AuthService
  ) {}

  /**
   * Lifecycle hook runs on component initialization
   * Sets up the calendar and loads data
   */
  ngOnInit(): void {
    // Get authenticated user ID
    this.userId = this.authService.getUserId();
    if (!this.userId) {
      this.errorMessage = 'User ID not found. Please log in again.';
      return;
    }

    // Initialize calendar state and load data
    this.initializeCalendarState();
    this.loadCalendarData();
  }

  /**
   * Sets up initial calendar state
   * Initializes year and month display based on current date
   */
  private initializeCalendarState(): void {
    this.currentYear = this.currentDate.getFullYear();
    this.updateMonthDisplay();
  }
  
  /**
   * Updates the formatted month/year label
   */
  private updateMonthDisplay(): void {
    this.currentMonth = this.currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  }

  /**
   * Loads cycle data and builds the calendar grid
   */
  private loadCalendarData(): void {
    if (!this.userId) return;
    this.isLoading = true;
    this.errorMessage = '';

    this.periodCycleService.getCyclesByUserId(this.userId).subscribe({
      next: cycles => {
        this.cycleData = cycles;
        this.generateCalendarGrid();
        this.isLoading = false;
      },
      error: err => {
        this.errorMessage = 'Could not load calendar data. Please try again later.';
        console.error('Error loading calendar data:', err);
        this.isLoading = false;
        this.generateCalendarGrid();  // Still render empty grid
      }
    });
  }

  /**
   * Builds the month grid with empty cells and cycle data
   * Creates an array of CalendarDay objects for the template
   */
  private generateCalendarGrid(): void {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    // Get first and last day of the month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Calculate offset for first day of month (0 = Sunday, 1 = Monday, etc.)
    // We want Monday as first day of week, so adjust offset
    let offset = firstDay.getDay() - 1;
    if (offset < 0) offset = 6; // Sunday becomes last day (index 6)

    this.monthDays = [];
    
    // Add empty cells for days before first of month
    for (let i = 0; i < offset; i++) {
      this.monthDays.push(this.createEmptyCell());
    }

    const today = new Date();
    
    // Fill in actual days of the month
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      
      // Get cycle status for this day
      const info = this.getDayInfo(date);
      
      // Check if this is today
      const isToday = this.isSameDay(date, today);
      
      // Add the day to the grid
      this.monthDays.push({
        day: d,
        date,
        active: info.isPeriod || info.isFertile || info.isOvulation,
        isPeriod: info.isPeriod,
        isFertile: info.isFertile,
        isOvulation: info.isOvulation,
        isToday,
        cycleId: info.cycleId
      });
    }
    
    // Add empty cells at end to complete the grid to full weeks
    const total = Math.ceil((offset + daysInMonth) / 7) * 7;
    while (this.monthDays.length < total) {
      this.monthDays.push(this.createEmptyCell());
    }
  }

  /**
   * Determines cycle status for a given date
   * Checks if date is within period, fertile window, or ovulation
   * 
   * @param date Date to check
   * @returns Object with cycle status flags
   */
  private getDayInfo(date: Date): { isPeriod: boolean; isFertile: boolean; isOvulation: boolean; cycleId?: number } {
    let isPeriod = false, isFertile = false, isOvulation = false;
    let cycleId: number | undefined;

    // Check each cycle to see if the date matches any conditions
    for (const cycle of this.cycleData) {
      const start = new Date(cycle.startDate);
      const end = new Date(cycle.endDate);
      
      // Check if date is within period
      if (date >= start && date <= end) {
        isPeriod = true;
        cycleId = cycle.cycleId;
      }
      
      // Calculate ovulation (14 days after period start)
      // This is a simplified calculation, not medically precise
      const ovDate = this.calculateOvulationDate(cycle);
      if (ovDate) {
        // Fertile window is ~5 days before ovulation
        const fertileStart = new Date(ovDate);
        fertileStart.setDate(ovDate.getDate() - 5);
        
        // Check if date is in fertile window
        if (date >= fertileStart && date <= ovDate) isFertile = true;
        
        // Check if date is ovulation day
        if (this.isSameDay(date, ovDate)) { 
          isOvulation = true; 
          isFertile = false; // Ovulation takes precedence
        }
        
        // Set cycleId if not set by period check
        if (!cycleId && (isFertile || isOvulation)) cycleId = cycle.cycleId;
      }
    }
    return { isPeriod, isFertile, isOvulation, cycleId };
  }

  /**
   * Calculates estimated ovulation date
   * Simplified as period start date + 14 days
   * 
   * @param cycle Period cycle data
   * @returns Estimated ovulation date
   */
  private calculateOvulationDate(cycle: Periodcycle): Date {
    const d = new Date(cycle.startDate);
    d.setDate(d.getDate() + 14); // Approx. 14 days after period starts
    return d;
  }

  /**
   * Checks if two dates are the same calendar day
   * 
   * @param a First date
   * @param b Second date
   * @returns True if same year, month and day
   */
  private isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear()===b.getFullYear() && 
           a.getMonth()===b.getMonth() && 
           a.getDate()===b.getDate();
  }

  /**
   * Navigates to previous or next month
   * 
   * @param direction -1 for previous month, 1 for next month
   */
  navigateMonth(direction: number): void {
    this.currentDate.setMonth(this.currentDate.getMonth() + direction);
    this.initializeCalendarState();
    this.loadCalendarData();
  }

  /**
   * Creates an empty calendar cell for padding
   * Used for days before first of month or after last of month
   */
  private createEmptyCell(): CalendarDay {
    return { 
      day: null, 
      date: null, 
      active: false, 
      isPeriod: false, 
      isFertile: false, 
      isOvulation: false, 
      isToday: false 
    };
  }

  /**
   * Logs out the current user
   */
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}