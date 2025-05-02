import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';

import { CalendarService } from '../../services/calendar.service';
import { PeriodCycleService } from '../../services/periodcycle.service';
import { CycleEntryService } from '../../services/cycleentry.service';
import { Calendar } from '../../models/calendar';
import { Periodcycle } from '../../models/periodcycle';
import { Cycleentry } from '../../models/cycleentry';
import { forkJoin, Observable, of, catchError } from 'rxjs';

interface CalendarDay {
  day: number | null;
  date: Date | null;
  active: boolean;
  selected: boolean;
  isPeriod: boolean;
  isFertile: boolean;
  isOvulation: boolean;
  isToday: boolean;
  cycleId?: number;
}

@Component({
  selector: 'app-calendar-view',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule,
    MatProgressSpinnerModule, 
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatMenuModule
  ],
  templateUrl: './calendar-view.component.html',
  styleUrls: ['./calendar-view.component.css']
})
export class CalendarViewComponent implements OnInit {
  // Calendar state
  currentDate: Date = new Date();
  currentMonth: string = '';
  currentYear: number = 0;
  
  // Calendar data
  weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  monthDays: CalendarDay[] = [];
  selectedDay: CalendarDay | null = null;
  
  // Data from services
  userId: number = 1; // This would normally come from an auth service
  calendarData: Calendar | null = null;
  cycleData: Periodcycle[] = [];
  entryData: Cycleentry[] = [];
  
  // UI state
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(
    private router: Router,
    private calendarService: CalendarService,
    private periodCycleService: PeriodCycleService,
    private cycleEntryService: CycleEntryService
  ) {}

  ngOnInit(): void {
    this.initializeCalendarState();
    this.loadCalendarData();
  }

  /**
   * Initialize the calendar with current month/year
   */
  private initializeCalendarState(): void {
    this.currentYear = this.currentDate.getFullYear();
    this.updateMonthDisplay();
  }
  
  /**
   * Updates the month display string based on current date
   */
  private updateMonthDisplay(): void {
    this.currentMonth = this.currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  }

  /**
   * Load all data needed for the calendar from services
   */
  private loadCalendarData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.selectedDay = null;
    
    // Get current month and year for API requests
    const month = this.currentDate.getMonth() + 1; // JavaScript months are 0-based
    const year = this.currentDate.getFullYear();
    
    // Create the requests but don't execute them yet
    const calendarRequest$ = this.calendarService.getCalendarByMonthYear(this.userId, month, year)
      .pipe(catchError(error => {
        console.error('Error fetching calendar:', error);
        return of(null);
      }));
      
    const cyclesRequest$ = this.periodCycleService.getCyclesByUserId(this.userId)
      .pipe(catchError(error => {
        console.error('Error fetching cycles:', error);
        return of([]);
      }));
    
    // Execute both requests in parallel
    forkJoin({
      calendar: calendarRequest$,
      cycles: cyclesRequest$
    }).subscribe({
      next: (results) => {
        this.calendarData = results.calendar;
        this.cycleData = results.cycles;
        
        // If we have a calendar, load the entries
        if (this.calendarData) {
          this.loadEntriesForCalendar(this.calendarData.calendar_id);
        } else {
          this.generateCalendarGrid();
          this.isLoading = false;
        }
      },
      error: (err) => {
        console.error('Error loading calendar data:', err);
        this.errorMessage = 'Could not load calendar data. Please try again later.';
        this.isLoading = false;
        this.generateCalendarGrid(); // Still generate the grid even if data loading fails
      }
    });
  }
  
  /**
   * Load entries for a specific calendar
   */
  private loadEntriesForCalendar(calendarId: number): void {
    this.cycleEntryService.getEntriesByCalendarId(calendarId)
      .pipe(catchError(error => {
        console.error('Error fetching entries:', error);
        return of([]);
      }))
      .subscribe({
        next: (entries) => {
          this.entryData = entries;
          this.generateCalendarGrid();
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading entries:', err);
          this.generateCalendarGrid(); // Still generate the grid even if entries fail to load
          this.isLoading = false;
        }
      });
  }

  /**
   * Generate the calendar grid for the current month
   */
  private generateCalendarGrid(): void {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    // Create a date object for the first day of the month
    const firstDayOfMonth = new Date(year, month, 1);
    
    // Get the number of days in the month
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    
    // Get the day of the week for the first day (0-6, where 0 is Sunday)
    // Convert to Monday = 0 format for our calendar
    let firstDayWeekday = firstDayOfMonth.getDay() - 1;
    if (firstDayWeekday < 0) firstDayWeekday = 6; // Sunday becomes 6
    
    // Clear the calendar grid
    this.monthDays = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayWeekday; i++) {
      this.monthDays.push({
        day: null,
        date: null,
        active: false,
        selected: false,
        isPeriod: false,
        isFertile: false,
        isOvulation: false,
        isToday: false
      });
    }
    
    // Today's date for comparison
    const today = new Date();
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      
      // Check if this date is a period day, fertile day, or ovulation day
      const periodInfo = this.getDayInfo(date);
      const isPeriod = periodInfo.isPeriod;
      const isFertile = periodInfo.isFertile;
      const isOvulation = periodInfo.isOvulation;
      const active = isPeriod || isFertile || isOvulation;
      
      // Check if this is today
      const isToday = this.isSameDay(date, today);
      
      this.monthDays.push({
        day: day,
        date: date,
        active: active,
        selected: false,
        isPeriod: isPeriod,
        isFertile: isFertile,
        isOvulation: isOvulation,
        isToday: isToday,
        cycleId: periodInfo.cycleId
      });
    }
    
    // Add empty cells for days after the end of the month to complete the grid
    const totalCells = Math.ceil((firstDayWeekday + daysInMonth) / 7) * 7;
    const remainingCells = totalCells - (firstDayWeekday + daysInMonth);
    
    for (let i = 0; i < remainingCells; i++) {
      this.monthDays.push({
        day: null,
        date: null,
        active: false,
        selected: false,
        isPeriod: false,
        isFertile: false,
        isOvulation: false,
        isToday: false
      });
    }
  }
  
  /**
   * Get detailed info about a specific day
   */
  private getDayInfo(date: Date): { isPeriod: boolean, isFertile: boolean, isOvulation: boolean, cycleId?: number } {
    let isPeriod = false;
    let isFertile = false;
    let isOvulation = false;
    let cycleId;
    
    // Check if this date is in any period cycle
    for (const cycle of this.cycleData) {
      const startDate = new Date(cycle.start_date);
      const endDate = new Date(cycle.end_date);
      
      // Check if date is within period
      if (date >= startDate && date <= endDate) {
        isPeriod = true;
        cycleId = cycle.cycle_id;
      }
      
      // Calculate fertile window (5 days before ovulation + ovulation day)
      const ovulationDate = this.calculateOvulationDate(cycle);
      
      if (ovulationDate) {
        // Fertile window starts 5 days before ovulation
        const fertileStart = new Date(ovulationDate);
        fertileStart.setDate(ovulationDate.getDate() - 5);
        
        // Check if date is in fertile window
        if (date >= fertileStart && date <= ovulationDate) {
          isFertile = true;
          if (!cycleId) cycleId = cycle.cycle_id;
        }
        
        // Check if date is ovulation day
        if (this.isSameDay(date, ovulationDate)) {
          isOvulation = true;
          isFertile = false; // Ovulation takes precedence over fertile for display
          if (!cycleId) cycleId = cycle.cycle_id;
        }
      }
    }
    
    return { isPeriod, isFertile, isOvulation, cycleId };
  }
  
  /**
   * Calculate the ovulation date based on a cycle
   * This is a simplified calculation - typically 14 days before next period
   */
  private calculateOvulationDate(cycle: Periodcycle): Date | null {
    const startDate = new Date(cycle.start_date);
    
    // For this simplified model, we'll estimate ovulation as 14 days after period start
    // In a real app, this would use a more sophisticated algorithm
    const ovulationDate = new Date(startDate);
    ovulationDate.setDate(startDate.getDate() + 14);
    
    return ovulationDate;
  }
  
  /**
   * Compare two dates to see if they're the same day
   */
  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  /**
   * Handle date selection in the calendar
   */
  selectDate(day: CalendarDay): void {
    if (day.day === null || day.date === null) {
      return; // Don't select empty cells
    }
    
    // Deselect any previously selected day
    this.monthDays.forEach(item => {
      item.selected = false;
    });
    
    // Select the clicked day
    day.selected = true;
    this.selectedDay = day;
  }

  /**
   * Get formatted date string for selected day
   */
  getSelectedDateFormatted(): string {
    if (!this.selectedDay || !this.selectedDay.date) {
      return '';
    }
    
    return this.selectedDay.date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  /**
   * Navigate to add cycle page with selected date
   */
  addCycleForDate(): void {
    if (!this.selectedDay || !this.selectedDay.date) {
      return;
    }
    
    const dateStr = this.selectedDay.date.toISOString().split('T')[0];
    this.router.navigate(['/cycle/add'], { queryParams: { date: dateStr } });
  }

  /**
   * Navigate to the previous or next month
   */
  navigateMonth(direction: number): void {
    // Create a new date for the navigation to avoid mutating the current date
    const newDate = new Date(this.currentDate);
    
    // Move to the previous or next month
    newDate.setMonth(newDate.getMonth() + direction);
    
    // Update the current date
    this.currentDate = newDate;
    this.currentYear = newDate.getFullYear();
    
    // Update the month display
    this.updateMonthDisplay();
    
    // Reload the calendar data
    this.loadCalendarData();
  }
}