import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';

import { PeriodCycleService } from '../../services/periodcycle.service';
import { CycleSymptomService, CycleSymptom } from '../../services/cyclesymptom.service';
import { AuthService } from '../../services/auth.service';
import { Periodcycle } from '../../models/Periodcycle';

/**
 * Extends Periodcycle to include symptom name/intensity pairs for display.
 */
interface CycleWithSymptoms extends Periodcycle {
  symptoms: { name: string; intensity: number }[];
}

/**
 * DashboardComponent
 * - Loads recent cycles for the logged-in user
 * - Fetches associated symptoms
 * - Calculates average cycle and period lengths
 * - Displays a spinner while loading and snackbars on actions
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  /** List of latest cycles enriched with symptoms for display */
  recentCycles: CycleWithSymptoms[] = [];
  isLoading = false;            // Shows spinner during data fetch
  errorMessage = '';            // Error text shown if load fails
  averageCycleLength?: number;  // Computed metric
  averagePeriodLength?: number; // Computed metric
  nextPeriodDate?: Date;        // Placeholder if predicting next period

  constructor(
    private periodCycleService: PeriodCycleService,
    private cycleSymptomService: CycleSymptomService,
    private auth: AuthService,
    private snack: MatSnackBar
  ) {}

  /** On component init, load cycles and symptoms */
  ngOnInit(): void {
    this.loadCycles();
  }

  /**
   * Loads cycles via async/await, enriches each with its symptoms,
   * then sorts and computes stats.
   */
  private async loadCycles(): Promise<void> {
    this.isLoading = true;
    const userId = this.auth.getUserId()!;
    try {
      // Fetch cycles as an array via firstValueFrom
      const cycles = await firstValueFrom(this.periodCycleService.getCyclesByUserId(userId));
      // Sort by most recent start date
      cycles.sort((a, b) => new Date(b.startDate).valueOf() - new Date(a.startDate).valueOf());

      // In parallel, fetch symptoms for each cycle
      const withSymptoms = await Promise.all(
        cycles.map(async cycle => {
          const cs: CycleSymptom[] = await firstValueFrom(
            this.cycleSymptomService.getCycleSymptomsByCycleId(cycle.cycleId)
          );
          // Map to simple name/intensity pairs
          const symptoms = cs.map(s => ({ name: s.symptom?.name || 'Unknown', intensity: s.intensity }));
          return { ...cycle, symptoms };
        })
      );

      this.recentCycles = withSymptoms;
      this.calculateStats(cycles);
    } catch {
      this.errorMessage = 'Failed to load cycles';
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Calculate average period and cycle lengths from a set of cycles.
   */
  private calculateStats(cycles: Periodcycle[]): void {
    if (!cycles.length) {
      this.averageCycleLength = undefined;
      this.averagePeriodLength = undefined;
      return;
    }

    // Period length = endDate - startDate + 1
    const periodLengths = cycles.map(c => {
      const start = new Date(c.startDate).valueOf();
      const end = new Date(c.endDate).valueOf();
      return Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
    });
    this.averagePeriodLength = Math.round(
      periodLengths.reduce((sum, len) => sum + len, 0) / periodLengths.length
    );

    // Cycle length = diff between consecutive start dates
    if (cycles.length > 1) {
      const sorted = [...cycles].sort(
        (a, b) => new Date(a.startDate).valueOf() - new Date(b.startDate).valueOf()
      );
      const diffs = sorted.slice(1).map((c, i) => {
        const prev = new Date(sorted[i].startDate).valueOf();
        const curr = new Date(c.startDate).valueOf();
        return Math.round((curr - prev) / (1000 * 60 * 60 * 24));
      });
      this.averageCycleLength = Math.round(
        diffs.reduce((sum, d) => sum + d, 0) / diffs.length
      );
    } else {
      this.averageCycleLength = undefined;
    }
  }

  /**
   * Deletes a cycle and updates the view and stats on success
   */
  onDeleteCycle(cycleId: number): void {
    const userId = this.auth.getUserId()!;
    this.periodCycleService.deleteCycle(cycleId, userId).subscribe({
      next: () => {
        // Remove from list and recalc
        this.recentCycles = this.recentCycles.filter(c => c.cycleId !== cycleId);
        this.calculateStats(this.recentCycles);
        this.snack.open('Cycle deleted', 'Close', { duration: 3000 });
      },
      error: () => this.snack.open('Failed to delete cycle', 'Close', { duration: 3000 })
    });
  }

  /** Logs out the current user */
  logout(): void {
    this.auth.logout();
  }
}