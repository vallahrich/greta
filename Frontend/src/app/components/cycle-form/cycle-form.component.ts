import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { PeriodCycleService } from '../../services/periodcycle.service';
import { AuthService } from '../../services/auth.service';
import { Periodcycle } from '../../models/Periodcycle';

@Component({
  selector: 'app-cycle-form',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule,
    RouterModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  templateUrl: './cycle-form.component.html',
  styleUrls: ['./cycle-form.component.css']
})
export class CycleFormComponent implements OnInit {
  @ViewChild('deleteDialog') deleteDialog!: TemplateRef<any>;
  
  userId: number | null = null;
  cycleForm!: FormGroup;
  isLoading: boolean = false;
  errorMessage: string = '';
  isEditMode: boolean = false;
  cycleId: number | null = null;
  
  minDate: Date = new Date(new Date().getFullYear() - 1, 0, 1);
  maxDate: Date = new Date();
  
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private periodCycleService: PeriodCycleService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}
  
  ngOnInit(): void {
    this.userId = this.authService.getUserId();
    
    if (!this.userId) {
      this.errorMessage = 'User ID not found. Please log in again.';
      this.snackBar.open('Please log in again.', 'Close', { duration: 3000 });
      this.router.navigate(['/login']);
      return;
    }
    
    this.initForm();
    this.checkForQueryParams();
    this.checkForEditMode();
  }
  
  private initForm(): void {
    this.cycleForm = this.formBuilder.group({
      startDate: ['', [Validators.required]],
      endDate: ['', [Validators.required]],
      notes: ['']
    }, { validators: this.dateRangeValidator });
  }
  
  private checkForQueryParams(): void {
    this.route.queryParams.subscribe(params => {
      if (params['date']) {
        try {
          const selectedDate = new Date(params['date']);
          if (!isNaN(selectedDate.getTime())) {
            this.cycleForm.patchValue({
              startDate: selectedDate,
              endDate: new Date(selectedDate)
            });
          }
        } catch (e) {
          console.error('Invalid date parameter:', e);
        }
      }
    });
  }
  
  private checkForEditMode(): void {
    this.route.params.subscribe(params => {
      if (params['cycle_id']) {
        this.isEditMode = true;
        this.cycleId = +params['cycle_id'];
        this.loadCycleData(this.cycleId);
      }
    });
  }
  
  private loadCycleData(cycleId: number): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.periodCycleService.getCycleById(cycleId).subscribe({
      next: (cycle) => {
        this.cycleForm.patchValue({
          startDate: new Date(cycle.startDate),
          endDate: new Date(cycle.endDate),
          notes: cycle.notes || ''
        });
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading cycle:', error);
        this.errorMessage = 'Could not load cycle data. Please try again.';
        this.isLoading = false;
      }
    });
  }
  
  private dateRangeValidator(group: FormGroup): {[key: string]: any} | null {
    const start = group.get('startDate')?.value;
    const end = group.get('endDate')?.value;
    
    if (start && end) {
      const startDate = start instanceof Date ? start : new Date(start);
      const endDate = end instanceof Date ? end : new Date(end);
      
      if (startDate > endDate) {
        return { 'dateRange': true };
      }
    }
    
    return null;
  }
  
  saveCycle(): void {
    if (this.cycleForm.invalid || !this.userId) {
      Object.keys(this.cycleForm.controls).forEach(key => {
        this.cycleForm.get(key)?.markAsTouched();
      });
      return;
    }
    
    this.isLoading = true;
    this.errorMessage = '';
    
    const formValues = this.cycleForm.value;
    
    const cycleData: Periodcycle = {
      cycleId: this.isEditMode && this.cycleId ? this.cycleId : 0,
      userId: Number(this.userId),
      startDate: formValues.startDate,
      endDate: formValues.endDate,
      notes: formValues.notes || '',
      duration: this.calculateDuration(formValues.startDate, formValues.endDate),
      createdAt: new Date()
    };
    
    if (this.isEditMode && this.cycleId) {
      this.updateCycle(cycleData);
    } else {
      this.createCycle(cycleData);
    }
  }
  
  private calculateDuration(startDate: Date, endDate: Date): number {
    const start = startDate instanceof Date ? startDate : new Date(startDate);
    const end = endDate instanceof Date ? endDate : new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }
  
  private createCycle(cycle: Periodcycle): void {
    this.periodCycleService.createCycle(cycle).subscribe({
      next: (savedCycle) => {
        this.snackBar.open('Cycle saved successfully', 'Close', { duration: 3000 });
        this.isLoading = false;
        this.navigateBack();
      },
      error: (error) => {
        console.error('Error saving cycle:', error);
        this.errorMessage = 'Could not save your cycle data. Please check the API configuration.';
        this.isLoading = false;
      }
    });
  }
  
  private updateCycle(cycle: Periodcycle): void {
    this.periodCycleService.updateCycle(cycle).subscribe({
      next: () => {
        this.snackBar.open('Cycle updated successfully', 'Close', { duration: 3000 });
        this.isLoading = false;
        this.navigateBack();
      },
      error: (error) => {
        console.error('Error updating cycle:', error);
        this.errorMessage = 'Could not update your cycle data. Please check the API configuration.';
        this.isLoading = false;
      }
    });
  }
  
  openDeleteConfirmation(): void {
    const dialogRef = this.dialog.open(this.deleteDialog);
    
    dialogRef.afterClosed().subscribe(result => {
      if (result && this.cycleId && this.userId) {
        this.deleteCycle(this.cycleId);
      }
    });
  }
  
  deleteCycle(cycleId: number): void {
    if (!this.userId) return;
    
    const userId = Number(this.userId);
    
    this.isLoading = true;
    
    this.periodCycleService.deleteCycle(cycleId, userId).subscribe({
      next: () => {
        this.snackBar.open('Cycle deleted successfully', 'Close', { duration: 3000 });
        this.isLoading = false;
        this.navigateBack();
      },
      error: (error) => {
        console.error('Error deleting cycle:', error);
        this.errorMessage = 'Could not delete the cycle. Please try again.';
        this.isLoading = false;
      }
    });
  }
  
  navigateBack(): void {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/dashboard']);
    }
  }
  
  cancel(): void {
    this.navigateBack();
  }
}