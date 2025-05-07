import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';

import { CycleService } from '../../services/cycle.service';
import { AuthService } from '../../services/auth.service';
import { CycleWithSymptoms } from '../../models/CycleWithSymptoms';
import { NavFooterComponent } from '../shared/nav-footer.component';

// Calendar day interface
interface CalendarDay {
  day: number | null;
  date: Date | null;
  active: boolean;
  isPeriod: boolean;
  isFertile: boolean;
  isOvulation: boolean;
  isToday: boolean;
  cycleId?: number;
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
  // Date info
  currentDate: Date = new Date();
  currentMonth: string = '';
  currentYear: number = 0;

  // Calendar data
  weekDays = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  monthDays: CalendarDay[] = [];

  // Cycles
  cycles: CycleWithSymptoms[] = [];
  
  // UI state
  isLoading = false;
  errorMessage = '';

  constructor(
    private router: Router,
    private cycleService: CycleService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.initializeCalendarState();
    this.loadCalendarData();
  }

  /**
   * Initialize calendar display
   */
  private initializeCalendarState(): void {
    this.currentYear = this.currentDate.getFullYear();
    this.updateMonthDisplay();
  }
  
  private updateMonthDisplay(): void {
    this.currentMonth = this.currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  }

  /**
   * Load cycle data for the calendar
   */
  private loadCalendarData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.cycleService.getUserCycles().subscribe({
      next: cycles => {
        this.cycles = cycles;
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
   * Generate the calendar grid for the current month
   */
  private generateCalendarGrid(): void {
    // Same implementation as before, but using the new cycles data structure
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    let offset = firstDay.getDay() - 1;
    if (offset < 0) offset = 6;

    this.monthDays = [];
    
    // Add empty cells for days before first of month
    for (let i = 0; i < offset; i++) {
      this.monthDays.push(this.createEmptyCell());
    }

    const today = new Date();
    
    // Fill in actual days of the month
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const info = this.getDayInfo(date);
      const isToday = this.isSameDay(date, today);
      
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
    
    // Add empty cells at end to complete the grid
    const total = Math.ceil((offset + daysInMonth) / 7) * 7;
    while (this.monthDays.length < total) {
      this.monthDays.push(this.createEmptyCell());
    }
  }

  /**
   * Determine cycle status for a given date
   */
  private getDayInfo(date: Date): { isPeriod: boolean; isFertile: boolean; isOvulation: boolean; cycleId?: number } {
    let isPeriod = false, isFertile = false, isOvulation = false;
    let cycleId: number | undefined;

    for (const cycle of this.cycles) {
      const start = new Date(cycle.startDate);
      const end = new Date(cycle.endDate);
      
      if (date >= start && date <= end) {
        isPeriod = true;
        cycleId = cycle.cycleId;
      }
      
      const ovDate = this.calculateOvulationDate(cycle);
      if (ovDate) {
        const fertileStart = new Date(ovDate);
        fertileStart.setDate(ovDate.getDate() - 5);
        
        if (date >= fertileStart && date <= ovDate) isFertile = true;
        
        if (this.isSameDay(date, ovDate)) { 
          isOvulation = true; 
          isFertile = false;
        }
        
        if (!cycleId && (isFertile || isOvulation)) cycleId = cycle.cycleId;
      }
    }
    return { isPeriod, isFertile, isOvulation, cycleId };
  }

  /**
   * Calculate approximate ovulation date (14 days after period start)
   */
  private calculateOvulationDate(cycle: CycleWithSymptoms): Date {
    const d = new Date(cycle.startDate);
    d.setDate(d.getDate() + 14);
    return d;
  }

  /**
   * Check if two dates are the same day
   */
  private isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && 
           a.getMonth() === b.getMonth() && 
           a.getDate() === b.getDate();
  }

  /**
   * Navigate to previous/next month
   */
  navigateMonth(direction: number): void {
    this.currentDate.setMonth(this.currentDate.getMonth() + direction);
    this.initializeCalendarState();
    this.generateCalendarGrid();
  }

  /**
   * Create an empty calendar cell
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

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}