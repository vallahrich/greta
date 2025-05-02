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
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { PeriodCycleService } from '../../services/periodcycle.service';
import { CycleEntryService } from '../../services/cycleentry.service';
import { Periodcycle } from '../../models/periodcycle';

interface Symptom {
  id: string;
  name: string;
  icon?: string;
}

// Separate interface for cycle notes storage
interface CycleNotes {
  cycleId: number;
  notes: string;
}

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
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  templateUrl: './cycle-form.component.html',
  styleUrls: ['./cycle-form.component.css']
})
export class CycleFormComponent implements OnInit {
  @ViewChild('deleteDialog') deleteDialog!: TemplateRef<any>;
  
  // User data
  userId: number = 1; // This would normally come from an auth service
  
  // Form handling
  cycleForm!: FormGroup;
  isLoading: boolean = false;
  errorMessage: string = '';
  isEditMode: boolean = false;
  cycleId: number | null = null;
  
  // Date constraints
  minDate: Date = new Date(new Date().getFullYear() - 1, 0, 1); // One year ago
  maxDate: Date = new Date(); // Today
  
  // Symptoms options
  availableSymptoms: Symptom[] = [
    { id: 'cramps', name: 'Cramps' },
    { id: 'headache', name: 'Headache' },
    { id: 'bloating', name: 'Bloating' },
    { id: 'fatigue', name: 'Fatigue' },
    { id: 'mood_swings', name: 'Mood Swings' },
    { id: 'acne', name: 'Acne' },
    { id: 'breast_tenderness', name: 'Breast Tenderness' },
    { id: 'backache', name: 'Backache' }
  ];
  
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private periodCycleService: PeriodCycleService,
    private cycleEntryService: CycleEntryService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}
  
  ngOnInit(): void {
    this.initForm();
    this.checkForQueryParams();
    this.checkForEditMode();
  }
  
  /**
   * Initialize the form with validators
   */
  private initForm(): void {
    this.cycleForm = this.formBuilder.group({
      startDate: ['', [Validators.required]],
      endDate: ['', [Validators.required]],
      symptoms: [[]],
      notes: [''] // Keep notes in the form but handle them separately
    }, { validators: this.dateRangeValidator });
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
              startDate: selectedDate
            });
            
            // Set end date to same date by default
            this.cycleForm.patchValue({
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
    
    this.periodCycleService.getCycleById(cycleId).subscribe({
      next: (cycle) => {
        // Populate form with cycle data
        this.cycleForm.patchValue({
          startDate: new Date(cycle.start_date),
          endDate: new Date(cycle.end_date)
        });
        
        // Load stored notes from localStorage
        const notes = this.loadStoredNotes(cycleId);
        if (notes) {
          this.cycleForm.patchValue({ notes });
        }
        
        // Load symptoms (this would need to be implemented in the backend)
        this.loadCycleSymptoms(cycleId);
        
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
   * Load notes from localStorage
   */
  private loadStoredNotes(cycleId: number): string | null {
    try {
      const storedNotes = localStorage.getItem('cycleNotes');
      if (storedNotes) {
        const allNotes: CycleNotes[] = JSON.parse(storedNotes);
        const cycleNotes = allNotes.find(note => note.cycleId === cycleId);
        return cycleNotes ? cycleNotes.notes : null;
      }
    } catch (error) {
      console.error('Error loading stored notes:', error);
    }
    return null;
  }
  
  /**
   * Save notes to localStorage
   */
  private saveNotesToStorage(cycleId: number, notes: string): void {
    try {
      const storedNotes = localStorage.getItem('cycleNotes');
      let allNotes: CycleNotes[] = storedNotes ? JSON.parse(storedNotes) : [];
      
      // Find if notes for this cycle already exist
      const existingIndex = allNotes.findIndex(note => note.cycleId === cycleId);
      
      if (existingIndex >= 0) {
        // Update existing notes
        allNotes[existingIndex].notes = notes;
      } else {
        // Add new notes
        allNotes.push({ cycleId, notes });
      }
      
      localStorage.setItem('cycleNotes', JSON.stringify(allNotes));
    } catch (error) {
      console.error('Error saving notes to storage:', error);
    }
  }
  
  /**
   * Delete notes from localStorage
   */
  private deleteNotesFromStorage(cycleId: number): void {
    try {
      const storedNotes = localStorage.getItem('cycleNotes');
      if (storedNotes) {
        let allNotes: CycleNotes[] = JSON.parse(storedNotes);
        allNotes = allNotes.filter(note => note.cycleId !== cycleId);
        localStorage.setItem('cycleNotes', JSON.stringify(allNotes));
      }
    } catch (error) {
      console.error('Error deleting notes from storage:', error);
    }
  }
  
  /**
   * Load symptoms for a cycle (mock implementation)
   */
  private loadCycleSymptoms(cycleId: number): void {
    // This would need to be implemented with a real service
    // For now, we'll just simulate it
    const mockSymptoms = ['cramps', 'fatigue']; // Example symptoms
    this.cycleForm.patchValue({
      symptoms: mockSymptoms
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
   * Save the cycle data to the database
   */
  saveCycle(): void {
    if (this.cycleForm.invalid) {
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
    const startDate: Date = formValues.startDate instanceof Date 
      ? formValues.startDate 
      : new Date(formValues.startDate);
      
    const endDate: Date = formValues.endDate instanceof Date 
      ? formValues.endDate 
      : new Date(formValues.endDate);
    
    // Calculate duration in days
    const durationMs = endDate.getTime() - startDate.getTime();
    const durationDays = Math.floor(durationMs / (1000 * 60 * 60 * 24)) + 1;
    
    // Create the cycle object without notes
    const cycleData: Partial<Periodcycle> = {
      user_id: this.userId,
      start_date: startDate,
      end_date: endDate,
      duration: durationDays
    };
    
    if (this.isEditMode && this.cycleId) {
      // Update existing cycle
      cycleData.cycle_id = this.cycleId;
      this.updateCycle(cycleData as Periodcycle, formValues.notes);
    } else {
      // Create new cycle
      this.createCycle(cycleData as Periodcycle, formValues.notes);
    }
  }
  
  /**
   * Create a new cycle
   */
  private createCycle(cycle: Periodcycle, notes: string): void {
    this.periodCycleService.createCycle(cycle).subscribe({
      next: (savedCycle) => {
        console.log('Saved cycle data:', savedCycle);
        
        // Save symptoms (this would need to be implemented in the backend)
        this.saveSymptoms(savedCycle.cycle_id, this.cycleForm.value.symptoms);
        
        // Save notes separately if present
        if (notes && notes.trim()) {
          this.saveNotesToStorage(savedCycle.cycle_id, notes);
        }
        
        this.snackBar.open('Cycle saved successfully', 'Close', { duration: 3000 });
        this.isLoading = false;
        this.navigateBack();
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
  private updateCycle(cycle: Periodcycle, notes: string): void {
    this.periodCycleService.updateCycle(cycle).subscribe({
      next: () => {
        // Save symptoms (this would need to be implemented in the backend)
        if (cycle.cycle_id) {
          this.saveSymptoms(cycle.cycle_id, this.cycleForm.value.symptoms);
        
          // Save notes separately if present
          if (notes && notes.trim()) {
            this.saveNotesToStorage(cycle.cycle_id, notes);
          } else {
            // Delete notes if empty
            this.deleteNotesFromStorage(cycle.cycle_id);
          }
        }
        
        this.snackBar.open('Cycle updated successfully', 'Close', { duration: 3000 });
        this.isLoading = false;
        this.navigateBack();
      },
      error: (error) => {
        console.error('Error updating cycle:', error);
        this.errorMessage = 'Could not update your cycle data. Please try again.';
        this.isLoading = false;
      }
    });
  }
  
  /**
   * Save symptoms for a cycle (mock implementation)
   */
  private saveSymptoms(cycleId: number, symptoms: string[]): void {
    // This would need to be implemented with a real service
    console.log(`Saving symptoms for cycle ${cycleId}:`, symptoms);
  }
  
  /**
   * Open delete confirmation dialog
   */
  openDeleteConfirmation(): void {
    const dialogRef = this.dialog.open(this.deleteDialog);
    
    dialogRef.afterClosed().subscribe(result => {
      if (result && this.cycleId) {
        this.deleteCycle(this.cycleId);
      }
    });
  }
  
  /**
   * Delete a cycle
   */
  deleteCycle(cycleId: number): void {
    this.isLoading = true;
    
    this.periodCycleService.deleteCycle(cycleId, this.userId).subscribe({
      next: () => {
        // Also delete notes for this cycle
        this.deleteNotesFromStorage(cycleId);
        
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
}