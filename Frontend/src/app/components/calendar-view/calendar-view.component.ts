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

// Defines the shape of each day in the calendar grid
interface CalendarDay {
  day: number | null;
  date: Date | null;
  active: boolean;           // highlights if any cycle event
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
  currentDate: Date = new Date();      // tracks displayed month
  currentMonth: string = '';           // formatted month/year label
  currentYear: number = 0;

  weekDays = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  monthDays: CalendarDay[] = [];       // array for grid cells

  userId: number | null = null;       // logged-in user ID
  cycleData: Periodcycle[] = [];      // loaded cycle records

  isLoading = false;                  // spinner flag
  errorMessage = '';

  constructor(
    private router: Router,
    private periodCycleService: PeriodCycleService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Retrieve authenticated user ID
    this.userId = this.authService.getUserId();
    if (!this.userId) {
      this.errorMessage = 'User ID not found. Please log in again.';
      return;
    }

    this.initializeCalendarState();
    this.loadCalendarData();
  }

  // Sets the year and month label based on currentDate
  private initializeCalendarState(): void {
    this.currentYear = this.currentDate.getFullYear();
    this.updateMonthDisplay();
  }
  private updateMonthDisplay(): void {
    this.currentMonth = this.currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  }

  // Fetch cycles then build the grid
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
        this.isLoading = false;
        this.generateCalendarGrid();  // still render empty grid
      }
    });
  }

  // Build month grid including empty slots and status flags
  private generateCalendarGrid(): void {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    let offset = firstDay.getDay() - 1;
    if (offset < 0) offset = 6;

    this.monthDays = [];
    // prepend empty cells
    for (let i = 0; i < offset; i++) {
      this.monthDays.push(this.createEmptyCell());
    }

    const today = new Date();
    // fill days
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
    // append empty cells to complete rows
    const total = Math.ceil((offset + daysInMonth) / 7) * 7;
    while (this.monthDays.length < total) {
      this.monthDays.push(this.createEmptyCell());
    }
  }

  // Returns status flags for a given date based on loaded cycles
  private getDayInfo(date: Date): { isPeriod: boolean; isFertile: boolean; isOvulation: boolean; cycleId?: number } {
    let isPeriod = false, isFertile = false, isOvulation = false;
    let cycleId: number | undefined;

    for (const cycle of this.cycleData) {
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
        if (this.isSameDay(date, ovDate)) { isOvulation = true; isFertile = false; }
        if (!cycleId && (isFertile || isOvulation)) cycleId = cycle.cycleId;
      }
    }
    return { isPeriod, isFertile, isOvulation, cycleId };
  }

  // Predicts ovulation as startDate + 14 days
  private calculateOvulationDate(cycle: Periodcycle): Date {
    const d = new Date(cycle.startDate);
    d.setDate(d.getDate() + 14);
    return d;
  }

  // Strict same-day comparison
  private isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
  }

  // Change displayed month and reload data
  navigateMonth(direction: number): void {
    this.currentDate.setMonth(this.currentDate.getMonth() + direction);
    this.initializeCalendarState();
    this.loadCalendarData();
  }

  // Creates an empty calendar cell
  private createEmptyCell(): CalendarDay {
    return { day: null, date: null, active: false, isPeriod: false, isFertile: false, isOvulation: false, isToday: false };
  }
}