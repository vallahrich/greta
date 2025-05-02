import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../services/auth.service';
import { PeriodCycleService } from '../../services/periodcycle.service';
import { Periodcycle } from '../../models/periodcycle';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  // User data
  userId: number = 1; // This would normally come from an auth service
  
  // Cycle data
  recentCycles: Periodcycle[] = [];
  
  // Stats
  averageCycleLength: number | null = null;
  averagePeriodLength: number | null = null;
  nextPeriodDate: Date | null = null;
  
  // UI state
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private periodCycleService: PeriodCycleService
  ) {}

  ngOnInit(): void {
    this.loadCycleData();
  }

  /**
   * Load cycle data from service
   */
  loadCycleData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.periodCycleService.getCyclesByUserId(this.userId).subscribe({
      next: (cycles) => {
        this.recentCycles = this.sortCyclesByDate(cycles);
        this.calculateStats(cycles);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading cycles:', error);
        this.errorMessage = 'Could not load your cycle data. Please try again later.';
        this.isLoading = false;
      }
    });
  }
  
  /**
   * Sort cycles by start date (most recent first)
   */
  sortCyclesByDate(cycles: Periodcycle[]): Periodcycle[] {
    return [...cycles].sort((a, b) => {
      const dateA = new Date(a.start_date).getTime();
      const dateB = new Date(b.start_date).getTime();
      return dateB - dateA; // Descending order (most recent first)
    });
  }
  
  /**
   * Calculate statistics based on cycle data
   */
  calculateStats(cycles: Periodcycle[]): void {
    if (cycles.length === 0) {
      return;
    }
    
    // Calculate average period length
    const totalPeriodDays = cycles.reduce((sum, cycle) => sum + cycle.duration, 0);
    this.averagePeriodLength = Math.round(totalPeriodDays / cycles.length);
    
    // Calculate average cycle length (time between period starts)
    if (cycles.length >= 2) {
      const sortedCycles = this.sortCyclesByDate(cycles).reverse(); // Oldest first for calculation
      let totalCycleDays = 0;
      let cycleCount = 0;
      
      for (let i = 0; i < sortedCycles.length - 1; i++) {
        const currentStart = new Date(sortedCycles[i].start_date);
        const nextStart = new Date(sortedCycles[i + 1].start_date);
        const cycleDays = Math.floor((nextStart.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24));
        
        if (cycleDays > 0 && cycleDays < 60) { // Filter out potentially erroneous data
          totalCycleDays += cycleDays;
          cycleCount++;
        }
      }
      
      if (cycleCount > 0) {
        this.averageCycleLength = Math.round(totalCycleDays / cycleCount);
        this.predictNextPeriod();
      }
    }
  }
  
  /**
   * Predict next period based on average cycle length
   */
  predictNextPeriod(): void {
    if (!this.averageCycleLength || this.recentCycles.length === 0) {
      return;
    }
    
    // Get most recent cycle start date
    const lastCycle = this.recentCycles[0];
    const lastStart = new Date(lastCycle.start_date);
    
    // Predict next period
    this.nextPeriodDate = new Date(lastStart);
    this.nextPeriodDate.setDate(lastStart.getDate() + this.averageCycleLength);
  }
  
  /**
   * Log the user out
   */
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}