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
  currentDate: Date = new Date();
  currentMonth: string = '';
  currentYear: number = 0;
  
  weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  monthDays: CalendarDay[] = [];
  selectedDay: CalendarDay | null = null;
  
  userId: number | null = null;
  cycleData: Periodcycle[] = [];
  
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(
    private router: Router,
    private periodCycleService: PeriodCycleService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.userId = this.authService.getUserId();
    if (!this.userId) {
      this.errorMessage = 'User ID not found. Please log in again.';
      return;
    }
    
    this.initializeCalendarState();
    this.loadCalendarData();
  }

  private initializeCalendarState(): void {
    this.currentYear = this.currentDate.getFullYear();
    this.updateMonthDisplay();
  }
  
  private updateMonthDisplay(): void {
    this.currentMonth = this.currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  }

  private loadCalendarData(): void {
    if (!this.userId) return;
    
    this.isLoading = true;
    this.errorMessage = '';
    this.selectedDay = null;
    
    this.periodCycleService.getCyclesByUserId(this.userId).subscribe({
      next: (cycles) => {
        console.log('Loaded cycles:', cycles);
        this.cycleData = cycles;
        this.generateCalendarGrid();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading calendar data:', err);
        this.errorMessage = 'Could not load calendar data. Please try again later.';
        this.isLoading = false;
        this.generateCalendarGrid();
      }
    });
  }

  private generateCalendarGrid(): void {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    
    let firstDayWeekday = firstDayOfMonth.getDay() - 1;
    if (firstDayWeekday < 0) firstDayWeekday = 6;
    
    this.monthDays = [];
    
    // Add empty cells
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
    
    const today = new Date();
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const periodInfo = this.getDayInfo(date);
      const isToday = this.isSameDay(date, today);
      
      this.monthDays.push({
        day: day,
        date: date,
        active: periodInfo.isPeriod || periodInfo.isFertile || periodInfo.isOvulation,
        selected: false,
        isPeriod: periodInfo.isPeriod,
        isFertile: periodInfo.isFertile,
        isOvulation: periodInfo.isOvulation,
        isToday: isToday,
        cycleId: periodInfo.cycleId
      });
    }
    
    // Add remaining empty cells
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
  
  private getDayInfo(date: Date): { isPeriod: boolean, isFertile: boolean, isOvulation: boolean, cycleId?: number } {
    let isPeriod = false;
    let isFertile = false;
    let isOvulation = false;
    let cycleId;
    
    for (const cycle of this.cycleData) {
      const startDate = new Date(cycle.startDate);
      const endDate = new Date(cycle.endDate);
      
      if (date >= startDate && date <= endDate) {
        isPeriod = true;
        cycleId = cycle.cycleId;
      }
      
      const ovulationDate = this.calculateOvulationDate(cycle);
      
      if (ovulationDate) {
        const fertileStart = new Date(ovulationDate);
        fertileStart.setDate(ovulationDate.getDate() - 5);
        
        if (date >= fertileStart && date <= ovulationDate) {
          isFertile = true;
          if (!cycleId) cycleId = cycle.cycleId;
        }
        
        if (this.isSameDay(date, ovulationDate)) {
          isOvulation = true;
          isFertile = false;
          if (!cycleId) cycleId = cycle.cycleId;
        }
      }
    }
    
    return { isPeriod, isFertile, isOvulation, cycleId };
  }
  
  private calculateOvulationDate(cycle: Periodcycle): Date | null {
    const startDate = new Date(cycle.startDate);
    const ovulationDate = new Date(startDate);
    ovulationDate.setDate(startDate.getDate() + 14);
    return ovulationDate;
  }
  
  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  selectDate(day: CalendarDay): void {
    if (day.day === null || day.date === null) {
      return;
    }
    
    this.monthDays.forEach(item => {
      item.selected = false;
    });
    
    day.selected = true;
    this.selectedDay = day;
  }

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
  
  addCycleForDate(): void {
    if (!this.selectedDay || !this.selectedDay.date) {
      return;
    }
    
    const dateStr = this.selectedDay.date.toISOString().split('T')[0];
    this.router.navigate(['/cycle/add'], { queryParams: { date: dateStr } });
  }

  navigateMonth(direction: number): void {
    const newDate = new Date(this.currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    this.currentDate = newDate;
    this.currentYear = newDate.getFullYear();
    this.updateMonthDisplay();
    this.loadCalendarData();
  }
}