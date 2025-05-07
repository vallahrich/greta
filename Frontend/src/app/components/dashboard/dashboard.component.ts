/**
 * Dashboard Component - Main landing page after login
 * 
 * This component provides:
 * - An overview of the user's period tracking data
 * - List of recent cycles with symptoms
 * - Statistics like average cycle length
 * - Quick actions for adding/editing/deleting cycles
 * 
 * It's the central hub of the application's functionality.
 */
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';

import { PeriodCycleService } from '../../services/periodcycle.service';
import { CycleSymptomService } from '../../services/cyclesymptom.service';
import { AuthService } from '../../services/auth.service';
import { Periodcycle } from '../../models/Periodcycle';
import { NavFooterComponent } from '../shared/nav-footer.component';

/**
 * Extended interface that adds symptom data to the cycle model
 * This combines data from multiple API endpoints for display purposes
 */
interface CycleWithSymptoms extends Periodcycle {
  symptoms: { name: string; intensity: number }[];
}

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    NavFooterComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardPageComponent implements OnInit {
  // Cycle data with symptoms for display
  recentCycles: CycleWithSymptoms[] = [];
  
  // UI state variables
  isLoading = false;            // Controls loading spinner
  errorMessage = '';            // Displays error messages
  
  // Statistics
  averageCycleLength?: number;  // Average days between periods
  averagePeriodLength?: number; // Average duration of periods
  nextPeriodDate?: Date;        // Predicted next period (future feature)

  constructor(
    private periodCycleService: PeriodCycleService,
    private cycleSymptomService: CycleSymptomService,
    private auth: AuthService,
    private snack: MatSnackBar,
    private router: Router
  ) {}

  /**
   * Lifecycle hook that runs when component initializes
   * Loads the user's cycle data
   */
  ngOnInit(): void {
    this.loadCycles();
  }

  /**
   * Loads cycle data and associated symptoms
   * Uses async/await with firstValueFrom for cleaner Promise-like syntax
   */
  private async loadCycles(): Promise<void> {
    this.isLoading = true;
    
    // Get authenticated user ID
    const userId = this.auth.getUserId();
    if (!userId) {
      this.errorMessage = 'User authentication error. Please log in again.';
      this.isLoading = false;
      return;
    }
    
    try {
      // Step 1: Fetch all cycles for the user
      const cycles = await firstValueFrom(this.periodCycleService.getCyclesByUserId(userId));
      
      // Sort by start date descending (most recent first)
      cycles.sort((a, b) => new Date(b.startDate).valueOf() - new Date(a.startDate).valueOf());

      // Step 2: For each cycle, fetch its associated symptoms
      const withSymptoms = await Promise.all(
        cycles.map(async cycle => {
          const cs = await firstValueFrom(
            this.cycleSymptomService.getCycleSymptomsByCycleId(cycle.cycleId)
          );
          // Map to simpler format for display
          const symptoms = cs.map(s => ({ 
            name: s.symptom?.name || 'Unknown', 
            intensity: s.intensity 
          }));
          return { ...cycle, symptoms };
        })
      );

      this.recentCycles = withSymptoms;
      
      // Calculate statistics based on cycles
      this.calculateStats(cycles);
    } catch (error) {
      this.errorMessage = 'Failed to load cycles';
      console.error('Error loading cycles:', error);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Calculates statistics from cycle data
   * - Average period length
   * - Average cycle length (time between periods)
   * 
   * @param cycles Array of period cycles
   */
  private calculateStats(cycles: Periodcycle[]): void {
    if (!cycles.length) {
      // No data to calculate stats
      this.averageCycleLength = undefined;
      this.averagePeriodLength = undefined;
      return;
    }

    // Calculate average period length (days from start to end)
    const periodLengths = cycles.map(c => {
      const start = new Date(c.startDate).valueOf();
      const end = new Date(c.endDate).valueOf();
      return Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1; // +1 for inclusive count
    });
    
    this.averagePeriodLength = Math.round(
      periodLengths.reduce((sum, len) => sum + len, 0) / periodLengths.length
    );

    // Calculate average cycle length (need at least 2 cycles)
    if (cycles.length > 1) {
      // Sort by start date ascending
      const sorted = [...cycles].sort(
        (a, b) => new Date(a.startDate).valueOf() - new Date(b.startDate).valueOf()
      );
      
      // Calculate days between consecutive start dates
      const diffs = sorted.slice(1).map((c, i) => {
        const prev = new Date(sorted[i].startDate).valueOf();
        const curr = new Date(c.startDate).valueOf();
        return Math.round((curr - prev) / (1000 * 60 * 60 * 24));
      });
      
      this.averageCycleLength = Math.round(
        diffs.reduce((sum, d) => sum + d, 0) / diffs.length
      );
    } else {
      this.averageCycleLength = undefined; // Need more cycles
    }
  }

  /**
   * Deletes a period cycle
   * 
   * @param cycleId ID of the cycle to delete
   */
  onDeleteCycle(cycleId: number): void {
    const userId = this.auth.getUserId();
    if (!userId) {
      this.errorMessage = 'User authentication error. Please log in again.';
      return;
    }
    
    // Directly delete the cycle - the backend will handle symptom deletion
    this.periodCycleService.deleteCycle(cycleId, userId).subscribe({
      next: () => {
        // Remove from local array (avoids reload)
        this.recentCycles = this.recentCycles.filter(c => c.cycleId !== cycleId);
        
        // Recalculate statistics
        this.calculateStats(this.recentCycles);
        
        // Show success message
        this.snack.open('Cycle deleted', 'Close', { duration: 3000 });
      },
      error: (err) => {
        console.error('Error deleting cycle:', err);
        this.snack.open('Failed to delete cycle', 'Close', { duration: 3000 });
      }
    });
  }
  
  /** 
   * Logs out the current user
   */
  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}