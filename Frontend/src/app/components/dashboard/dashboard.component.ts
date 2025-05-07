import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';

import { CycleService } from '../../services/cycle.service';
import { AuthService } from '../../services/auth.service';
import { CycleWithSymptoms } from '../../models/CycleWithSymptoms';
import { NavFooterComponent } from '../shared/nav-footer.component';

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
  // User's cycles with symptoms - named to match the HTML template
  recentCycles: CycleWithSymptoms[] = [];
  
  // UI state
  isLoading = false;
  errorMessage = '';
  
  // Statistics
  averageCycleLength?: number;
  averagePeriodLength?: number;

  constructor(
    private cycleService: CycleService,
    private auth: AuthService,
    private snack: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCycles();
  }

  /**
   * Loads all cycles with their symptoms in a single API call
   */
  loadCycles(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.cycleService.getUserCycles().subscribe({
      next: (data) => {
        // Sort by start date (most recent first)
        this.recentCycles = data.sort((a, b) => 
          new Date(b.startDate).valueOf() - new Date(a.startDate).valueOf()
        );
        
        // Calculate statistics
        this.calculateStats(this.recentCycles);
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to load cycles';
        console.error('Error loading cycles:', err);
        this.isLoading = false;
      }
    });
  }

  /**
   * Calculates statistics from cycle data
   */
  private calculateStats(cycles: CycleWithSymptoms[]): void {
    if (!cycles.length) {
      this.averageCycleLength = undefined;
      this.averagePeriodLength = undefined;
      return;
    }

    // Calculate period lengths (same calculation as before)
    const periodLengths = cycles.map(c => {
      const start = new Date(c.startDate).valueOf();
      const end = new Date(c.endDate).valueOf();
      return Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
    });
    
    this.averagePeriodLength = Math.round(
      periodLengths.reduce((sum, len) => sum + len, 0) / periodLengths.length
    );

    // Calculate cycle lengths (need at least 2 cycles)
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
      this.averageCycleLength = undefined;
    }
  }

  /**
   * Deletes a cycle
   */
  onDeleteCycle(cycleId: number): void {
    this.cycleService.deleteCycle(cycleId).subscribe({
      next: () => {
        // Remove from local array (avoids reload)
        this.recentCycles = this.recentCycles.filter(c => c.cycleId !== cycleId);
        
        // Recalculate statistics
        this.calculateStats(this.recentCycles);
        
        this.snack.open('Cycle deleted', 'Close', { duration: 3000 });
      },
      error: (err) => {
        console.error('Error deleting cycle:', err);
        this.snack.open('Failed to delete cycle', 'Close', { duration: 3000 });
      }
    });
  }
  
  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}