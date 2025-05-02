import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSliderModule } from '@angular/material/slider';
import { MatSelectModule } from '@angular/material/select'; // Add this import

import { PeriodCycleService } from '../../services/periodcycle.service';
import { SymptomService } from '../../services/symptom.service';
import { CycleSymptomService } from '../../services/cyclesymptom.service';
import { AuthService } from '../../services/auth.service';
import { Periodcycle } from '../../models/Periodcycle';
import { Symptom } from '../../models/Symptom';
import { CycleSymptom } from '../../models/CycleSymptom';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

@Component({
  selector: 'app-cycle-form',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatSliderModule,
    MatSelectModule // Add this module
  ],
  templateUrl: './cycle-form.component.html',
  styleUrls: ['./cycle-form.component.css']
})
export class CycleFormComponent implements OnInit {
  @ViewChild('deleteDialog') deleteDialog!: TemplateRef<any>;
  @ViewChild('symptomDialog') symptomDialog!: TemplateRef<any>;
  
  // User data
  userId: number | null = null;
  
  // Form handling
  cycleForm!: FormGroup;
  symptomForm!: FormGroup;
  isLoading: boolean = false;
  errorMessage: string = '';
  isEditMode: boolean = false;
  cycleId: number | null = null;
  
  // Date constraints
  minDate: Date = new Date(new Date().getFullYear() - 1, 0, 1); // One year ago
  maxDate: Date = new Date(); // Today
  
  // Symptoms data
  availableSymptoms: Symptom[] = [];
  selectedSymptoms: Map<number, CycleSymptom> = new Map();
  currentSymptom: CycleSymptom | null = null;
  
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private periodCycleService: PeriodCycleService,
    private symptomService: SymptomService,
    private cycleSymptomService: CycleSymptomService,
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
    this.loadSymptoms();
    this.checkForQueryParams();
    this.checkForEditMode();
  }
  
  /**
   * Format display value for slider
   */
  formatSliderThumbValue(value: number): string {
    return value.toString();
  }
  
  /**
   * Initialize the form with validators
   */
  private initForm(): void {
    this.cycleForm = this.formBuilder.group({
      startDate: ['', [Validators.required]],
      endDate: ['', [Validators.required]],
      notes: ['']
    }, { validators: this.dateRangeValidator });
    
    // Initialize symptom form
    this.symptomForm = this.formBuilder.group({
      symptomId: ['', [Validators.required]],
      intensity: [3, [Validators.required, Validators.min(1), Validators.max(5)]],
      date: ['', [Validators.required]]
    });
  }
  
  /**
   * Load all available symptoms
   */
  private loadSymptoms(): void {
    this.symptomService.getAllSymptoms().subscribe({
      next: (symptoms) => {
        this.availableSymptoms = symptoms;
      },
      error: (error) => {
        console.error('Error loading symptoms:', error);
        this.errorMessage = 'Could not load symptoms. Please try again.';
      }
    });
  }
  
  /**
   * Check URL query parameters for default date
   */
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
  
  /**
   * Check if we're in edit mode and load cycle data if we are
   */
  private checkForEditMode(): void {
    this.route.params.subscribe(params => {
      if (params['cycle_id']) {
        this.isEditMode = true;
        this.cycleId = +params['cycle_id'];
        this.loadCycleData(this.cycleId);
      }
    });
  }
  
  /**
   * Load cycle data for editing
   */
  private loadCycleData(cycleId: number): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    // Load both cycle data and cycle symptoms
    forkJoin({
      cycle: this.periodCycleService.getCycleById(cycleId),
      symptoms: this.cycleSymptomService.getCycleSymptomsByCycleId(cycleId).pipe(
        catchError(error => {
          console.error('Error loading cycle symptoms:', error);
          return of([] as CycleSymptom[]);
        })
      )
    }).subscribe({
      next: (result) => {
        // Populate form with cycle data
        this.cycleForm.patchValue({
          startDate: new Date(result.cycle.start_date),
          endDate: new Date(result.cycle.end_date),
          notes: result.cycle.notes || ''
        });
        
        // Set selected symptoms
        result.symptoms.forEach(symptom => {
          this.selectedSymptoms.set(symptom.symptom_id, symptom);
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
  
  /**
   * Custom validator to ensure end date is after start date
   */
  private dateRangeValidator(group: FormGroup): {[key: string]: any} | null {
    const start = group.get('startDate')?.value;
    const end = group.get('endDate')?.value;
    
    if (start && end) {
      // Convert to date objects if they're strings
      const startDate = start instanceof Date ? start : new Date(start);
      const endDate = end instanceof Date ? end : new Date(end);
      
      if (startDate > endDate) {
        return { 'dateRange': true };
      }
    }
    
    return null;
  }
  
  /**
   * Open symptom dialog to add/edit a symptom
   */
  openSymptomDialog(symptomId?: number): void {
    // Set default date to cycle start date if adding new symptom
    const cycleStartDate = this.cycleForm.get('startDate')?.value;
    const cycleEndDate = this.cycleForm.get('endDate')?.value;
    
    if (!cycleStartDate || !cycleEndDate) {
      this.snackBar.open('Please set cycle dates first', 'Close', { duration: 3000 });
      return;
    }
    
    // Reset form
    this.symptomForm.reset({
      intensity: 3
    });
    
    if (symptomId && this.selectedSymptoms.has(symptomId)) {
      // Edit existing symptom
      const symptom = this.selectedSymptoms.get(symptomId)!;
      this.currentSymptom = symptom;
      
      this.symptomForm.patchValue({
        symptomId: symptom.symptom_id,
        intensity: symptom.intensity,
        date: new Date(symptom.date)
      });
    } else {
      // New symptom
      this.currentSymptom = null;
      this.symptomForm.patchValue({
        date: new Date(cycleStartDate)
      });
    }
    
    // Set date validation
    this.symptomForm.get('date')?.setValidators([
      Validators.required,
      this.dateInRangeValidator(new Date(cycleStartDate), new Date(cycleEndDate))
    ]);
    this.symptomForm.get('date')?.updateValueAndValidity();
    
    // Open dialog
    this.dialog.open(this.symptomDialog, {
      width: '400px'
    });
  }
  
  /**
   * Custom validator to ensure symptom date is within cycle date range
   */
  private dateInRangeValidator(startDate: Date, endDate: Date) {
    return (control: any) => {
      const date = control.value;
      if (!date) return null;
      
      const symptomDate = date instanceof Date ? date : new Date(date);
      
      // Clear time portion for comparison
      const clearTime = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const clearedSymptomDate = clearTime(symptomDate);
      const clearedStartDate = clearTime(startDate);
      const clearedEndDate = clearTime(endDate);
      
      if (clearedSymptomDate < clearedStartDate || clearedSymptomDate > clearedEndDate) {
        return { 'dateOutOfRange': true };
      }
      
      return null;
    };
  }
  
  /**
   * Save symptom to selected symptoms list
   */
  saveSymptom(): void {
    if (this.symptomForm.invalid) {
      return;
    }
    
    const formValue = this.symptomForm.value;
    const symptomId = formValue.symptomId;
    const symptom = this.availableSymptoms.find(s => s.symptom_id === symptomId);
    
    if (!symptom) {
      return;
    }
    
    const cycleSymptom: CycleSymptom = {
      cycle_symptom_id: this.currentSymptom?.cycle_symptom_id || 0,
      cycle_id: this.cycleId || 0,
      symptom_id: symptomId,
      intensity: formValue.intensity,
      date: formValue.date,
      created_at: new Date(),
      symptom: symptom
    };
    
    // Store in map
    this.selectedSymptoms.set(symptomId, cycleSymptom);
    
    // Close dialog
    this.dialog.closeAll();
  }
  
  /**
   * Remove symptom from selected list
   */
  removeSymptom(symptomId: number): void {
    this.selectedSymptoms.delete(symptomId);
  }
  
  /**
   * Save the cycle data to the database
   */
  saveCycle(): void {
    if (this.cycleForm.invalid || !this.userId) {
      // Mark fields as touched to trigger validation messages
      Object.keys(this.cycleForm.controls).forEach(key => {
        this.cycleForm.get(key)?.markAsTouched();
      });
      return;
    }
    
    this.isLoading = true;
    this.errorMessage = '';
    
    const formValues = this.cycleForm.value;
    
    // Create period cycle data
    const cycleData: Partial<Periodcycle> = {
      user_id: this.userId,
      start_date: formValues.startDate,
      end_date: formValues.endDate,
      duration: this.calculateDuration(formValues.startDate, formValues.endDate),
      notes: formValues.notes
    };
    
    if (this.isEditMode && this.cycleId) {
      // Update existing cycle
      cycleData.cycle_id = this.cycleId;
      this.updateCycle(cycleData as Periodcycle);
    } else {
      // Create new cycle
      this.createCycle(cycleData as Periodcycle);
    }
  }
  
  /**
   * Calculate duration in days between two dates
   */
  private calculateDuration(startDate: Date, endDate: Date): number {
    const start = startDate instanceof Date ? startDate : new Date(startDate);
    const end = endDate instanceof Date ? endDate : new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }
  
  /**
   * Create a new cycle
   */
  private createCycle(cycle: Periodcycle): void {
    this.periodCycleService.createCycle(cycle).subscribe({
      next: (savedCycle) => {
        console.log('Saved cycle data:', savedCycle);
        
        // Save symptoms if any
        if (this.selectedSymptoms.size > 0) {
          this.saveCycleSymptoms(savedCycle.cycle_id);
        } else {
          this.finalizeSave('Cycle saved successfully');
        }
      },
      error: (error) => {
        console.error('Error saving cycle:', error);
        this.errorMessage = 'Could not save your cycle data. Please try again.';
        this.isLoading = false;
      }
    });
  }
  
  /**
   * Update an existing cycle
   */
  private updateCycle(cycle: Periodcycle): void {
    this.periodCycleService.updateCycle(cycle).subscribe({
      next: () => {
        // Handle symptoms for existing cycle
        if (this.cycleId) {
          this.saveCycleSymptoms(this.cycleId);
        } else {
          this.finalizeSave('Cycle updated successfully');
        }
      },
      error: (error) => {
        console.error('Error updating cycle:', error);
        this.errorMessage = 'Could not update your cycle data. Please try again.';
        this.isLoading = false;
      }
    });
  }
  
  /**
   * Save cycle symptoms to the database
   */
  private saveCycleSymptoms(cycleId: number): void {
    // First delete all existing cycle symptoms
    this.cycleSymptomService.deleteCycleSymptomsByCycleId(cycleId)
      .pipe(
        finalize(() => {
          // If no symptoms to add, we're done
          if (this.selectedSymptoms.size === 0) {
            this.finalizeSave('Cycle updated successfully');
            return;
          }
          
          // Create observables for each symptom save operation
          const saveOperations = Array.from(this.selectedSymptoms.values()).map(symptom => {
            // Set cycle ID
            symptom.cycle_id = cycleId;
            // Remove existing ID to create new
            if (!this.isEditMode) {
              symptom.cycle_symptom_id = 0;
            }
            return this.cycleSymptomService.createCycleSymptom(symptom);
          });
          
          // Execute all saves
          forkJoin(saveOperations)
            .subscribe({
              next: () => {
                this.finalizeSave('Cycle and symptoms saved successfully');
              },
              error: (error) => {
                console.error('Error saving symptoms:', error);
                this.errorMessage = 'Could not save symptoms. Cycle was saved.';
                this.isLoading = false;
              }
            });
        })
      )
      .subscribe({
        error: (error) => {
          console.error('Error deleting existing symptoms:', error);
          // Continue anyway to save new symptoms
          this.finalizeSave('Cycle saved, but could not update symptoms');
        }
      });
  }
  
  /**
   * Finalize the save operation
   */
  private finalizeSave(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 3000 });
    this.isLoading = false;
    this.navigateBack();
  }
  
  /**
   * Open delete confirmation dialog
   */
  openDeleteConfirmation(): void {
    const dialogRef = this.dialog.open(this.deleteDialog);
    
    dialogRef.afterClosed().subscribe(result => {
      if (result && this.cycleId && this.userId) {
        this.deleteCycle(this.cycleId);
      }
    });
  }
  
  /**
   * Delete a cycle
   */
  deleteCycle(cycleId: number): void {
    if (!this.userId) return;
    
    this.isLoading = true;
    
    this.periodCycleService.deleteCycle(cycleId, this.userId).subscribe({
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
  
  /**
   * Navigate back to previous page or dashboard
   */
  navigateBack(): void {
    // Check if we can go back in history
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // Default to dashboard
      this.router.navigate(['/dashboard']);
    }
  }
  
  /**
   * Cancel form and navigate back
   */
  cancel(): void {
    this.navigateBack();
  }
  
  /**
   * Get symptom object from ID
   */
  getSymptomById(id: number): Symptom | undefined {
    return this.availableSymptoms.find(s => s.symptom_id === id);
  }
  
  /**
   * Get color for symptom intensity
   */
  getIntensityColor(intensity: number): string {
    switch (intensity) {
      case 1: return '#BBDEFB'; // Light blue
      case 2: return '#90CAF9'; // Lighter blue
      case 3: return '#FFD54F'; // Amber
      case 4: return '#FFA726'; // Orange
      case 5: return '#FF7043'; // Deep orange
      default: return '#E0E0E0'; // Grey
    }
  }
}