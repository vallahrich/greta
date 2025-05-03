// src/app/components/dashboard/dashboard.component.ts
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

interface CycleWithSymptoms extends Periodcycle {
  symptoms: { name: string; intensity: number }[];
}

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
  recentCycles: CycleWithSymptoms[] = [];
  isLoading = false;
  errorMessage = '';
  averageCycleLength?: number;
  averagePeriodLength?: number;
  nextPeriodDate?: Date;

  constructor(
    private periodCycleService: PeriodCycleService,
    private cycleSymptomService: CycleSymptomService,
    private auth: AuthService,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadCycles();
  }

  private async loadCycles(): Promise<void> {
    this.isLoading = true;
    const userId = this.auth.getUserId()!;
    try {
      const cycles = await firstValueFrom(this.periodCycleService.getCyclesByUserId(userId));
      // sort newest first
      cycles.sort((a, b) => new Date(b.startDate).valueOf() - new Date(a.startDate).valueOf());

      // fetch symptoms for each cycle in parallel
      const withSymptoms = await Promise.all(
        cycles.map(async (cycle): Promise<CycleWithSymptoms> => {
          const cycleSymptoms: CycleSymptom[] = await firstValueFrom(
            this.cycleSymptomService.getCycleSymptomsByCycleId(cycle.cycleId)
          );
          
          // Transform cycle symptoms to include name and intensity
          const symptoms = cycleSymptoms.map(cs => ({
            name: cs.symptom?.name || 'Unknown',
            intensity: cs.intensity
          }));
          
          return { ...cycle, symptoms };
        })
      );

      this.recentCycles = withSymptoms;
      this.calculateStats(cycles);
    } catch (err) {
      this.errorMessage = 'Failed to load cycles';
    } finally {
      this.isLoading = false;
    }
  }

  private calculateStats(cycles: Periodcycle[]): void {
    if (!cycles.length) {
      this.averageCycleLength = undefined;
      this.averagePeriodLength = undefined;
      return;
    }
  
    // Compute each period's bleeding length (end – start + 1 day)
    const periodLengths = cycles.map(c => {
      const start = new Date(c.startDate).valueOf();
      const end   = new Date(c.endDate).valueOf();
      return Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
    });
    this.averagePeriodLength = Math.round(
      periodLengths.reduce((sum, len) => sum + len, 0) / periodLengths.length
    );
  
    // Compute inter-cycle lengths (diff between consecutive start dates)
    if (cycles.length > 1) {
      const sorted = [...cycles].sort(
        (a, b) => new Date(a.startDate).valueOf() - new Date(b.startDate).valueOf()
      );
      const cycleDiffs: number[] = [];
      for (let i = 1; i < sorted.length; i++) {
        const prev = new Date(sorted[i - 1].startDate).valueOf();
        const curr = new Date(sorted[i].startDate).valueOf();
        cycleDiffs.push(Math.round((curr - prev) / (1000 * 60 * 60 * 24)));
      }
      this.averageCycleLength = Math.round(
        cycleDiffs.reduce((sum, d) => sum + d, 0) / cycleDiffs.length
      );
    } else {
      this.averageCycleLength = undefined;
    }
  }

  onDeleteCycle(cycleId: number): void {
    const userId = this.auth.getUserId()!;
    this.periodCycleService.deleteCycle(cycleId, userId).subscribe({
      next: () => {
        this.recentCycles = this.recentCycles.filter(c => c.cycleId !== cycleId);
        this.calculateStats(this.recentCycles);
        this.snack.open('Cycle deleted', 'Close', { duration: 3000 });
      },
      error: () => {
        this.snack.open('Failed to delete cycle', 'Close', { duration: 3000 });
      }
    });
  }

  logout(): void {
    this.auth.logout();
  }
}