import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule} from '@angular/forms';

// Angular Material modules
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';

// Services and models
import { AuthService } from '../../services/auth.service';
import { CycleService } from '../../services/cycle.service';
import { SymptomService } from '../../services/symptom.service';
import { CycleWithSymptoms, CycleSymptom } from '../../models/CycleWithSymptoms';
import { Symptom } from '../../models/Symptom';
import { NavFooterComponent } from '../shared/nav-footer.component';

@Component({
  selector: 'app-cycle-form-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    // Material modules
    MatIconModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatDialogModule,
    NavFooterComponent
  ],
  templateUrl: './cycle-form.component.html',
  styleUrls: ['./cycle-form.component.css']
})
export class CycleFormPageComponent implements OnInit {
  @ViewChild('deleteDialog') deleteDialog!: TemplateRef<any>;
  
  isEditMode = false;
  cycleId: number | null = null;
  cycleForm!: FormGroup;
  allSymptoms: Symptom[] = [];
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private location: Location,
    private route: ActivatedRoute,
    private router: Router,
    private cycleService: CycleService,
    private symptomService: SymptomService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    // Build the form
    this.cycleForm = this.fb.group({
      cycleId: [0],
      startDate: [null, Validators.required],
      endDate: [null, Validators.required],
      notes: [''],
      symptoms: this.fb.array([])
    }, { validators: this.dateRangeValidator });

    // Check if editing
    this.route.params.subscribe(params => {
      if (params['cycle_id']) {
        this.isEditMode = true;
        this.cycleId = +params['cycle_id'];
      }
    });

    // Load symptom catalog
    this.loadSymptoms();
  }

  /**
   * Loads available symptoms and initializes form controls
   */
  private loadSymptoms(): void {
    this.symptomService.getSymptomCatalog().subscribe({
      next: syms => {
        this.allSymptoms = syms;
        
        // Create form controls for each symptom
        syms.forEach(s => {
          const group = this.fb.group({
            symptomId: [s.symptomId],
            symptomName: [s.name],
            selected: [false],
            intensity: [{ value: 1, disabled: true }, [Validators.min(1), Validators.max(5)]],
            date: [new Date()] // Default to today
          });
          
          // Enable/disable intensity when selected changes
          group.get('selected')!.valueChanges.subscribe(sel =>
            sel ? group.get('intensity')!.enable({ emitEvent: false })
                : group.get('intensity')!.disable({ emitEvent: false })
          );
          
          this.symptoms.push(group);
        });
        
        // If editing, load the cycle data
        if (this.isEditMode && this.cycleId) {
          this.loadCycle();
        }
      },
      error: (err) => {
        console.error('Failed to load symptoms:', err);
        this.errorMessage = 'Failed to load symptoms';
      }
    });
  }
  
  /**
   * Loads an existing cycle for editing
   */
  private loadCycle(): void {
    if (!this.cycleId) return;
    
    this.isLoading = true;
    
    this.cycleService.getUserCycles().subscribe({
      next: (cycles) => {
        // Find the cycle we're editing
        const cycle = cycles.find(c => c.cycleId === this.cycleId);
        
        if (cycle) {
          // Patch form with cycle data
          this.cycleForm.patchValue({
            cycleId: cycle.cycleId,
            startDate: new Date(cycle.startDate),
            endDate: new Date(cycle.endDate),
            notes: cycle.notes || ''
          });
          
          // Set symptom selection
          cycle.symptoms.forEach((cs: { symptomId: number; intensity: any; date: string | number | Date; }) => {
            const index = this.allSymptoms.findIndex(s => s.symptomId === cs.symptomId);
            if (index !== -1 && index < this.symptoms.controls.length) {
              const control = this.symptoms.at(index);
              control.get('selected')?.setValue(true);
              control.get('intensity')?.setValue(cs.intensity);
              control.get('date')?.setValue(new Date(cs.date));
            }
          });
        } else {
          this.errorMessage = 'Cycle not found';
        }
        
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading cycle data:', err);
        this.errorMessage = 'Failed to load cycle data';
        this.isLoading = false;
      }
    });
  }

  // Convenience getter for the symptoms form array
  get symptoms(): FormArray {
    return this.cycleForm.get('symptoms') as FormArray;
  }

  /**
   * Custom validator for date range
   */
  private dateRangeValidator(group: FormGroup) {
    const start = group.get('startDate')!.value;
    const end = group.get('endDate')!.value;
    return start && end && end < start ? { dateRange: true } : null;
  }

  /**
   * Cancel editing and go back
   */
  cancel(): void {
    this.location.back();
  }

  /**
   * Opens delete confirmation dialog
   */
  openDeleteConfirmation(): void {
    if (!this.cycleId) return;
    
    const dialogRef = this.dialog.open(this.deleteDialog);
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deleteCycle();
      }
    });
  }
  
  /**
   * Deletes the current cycle
   */
  deleteCycle(): void {
    if (!this.cycleId) return;
    
    this.isLoading = true;
    
    this.cycleService.deleteCycle(this.cycleId).subscribe({
      next: () => {
        this.isLoading = false;
        this.snackBar.open('Cycle deleted', 'Close', { duration: 3000 });
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Failed to delete cycle';
        console.error('Error deleting cycle:', err);
      }
    });
  }

  /**
   * Saves the cycle and symptoms
   */
  saveCycle(): void {
    if (this.cycleForm.invalid) {
      console.log('Form is invalid');
      return;
    }
    
    this.isLoading = true;
    
    const userId = this.auth.getUserId();
    console.log('Current userId:', userId);
    
    if (!userId) {
      this.errorMessage = 'User authentication error. Please log in again.';
      this.isLoading = false;
      return;
    }
    
    // Get the form values
    const startDate = this.cycleForm.value.startDate;
    const endDate = this.cycleForm.value.endDate;
    
    console.log('=== PREPARING CYCLE DATA ===');
    console.log('Form startDate:', startDate, typeof startDate);
    console.log('Form endDate:', endDate, typeof endDate);
    
    // Prepare symptoms with proper dates
    const symptoms = this.symptoms.controls
      .filter(c => c.value.selected)
      .map(c => {
        // Use start date as default if no specific date is set
        // This ensures symptom dates are within the cycle range
        let symptomDate = c.value.date;
        
        // If date is not set or invalid, use start date
        if (!symptomDate || !(symptomDate instanceof Date)) {
          symptomDate = startDate;
        }
        
        // Ensure symptom date is not before start date or after end date
        if (symptomDate < startDate) {
          symptomDate = startDate;
        } else if (symptomDate > endDate) {
          symptomDate = endDate;
        }
        
        console.log('Processing symptom:', {
          id: c.value.symptomId,
          name: c.value.symptomName,
          originalDate: c.value.date,
          finalDate: symptomDate,
          dateType: typeof symptomDate
        });
        
        return {
          symptomId: c.value.symptomId,
          name: c.value.symptomName,
          intensity: c.value.intensity,
          date: symptomDate  // Ensure this is a Date object
        };
      });
    
    // Prepare the cycle data
    const cycleData: CycleWithSymptoms = {
      cycleId: this.isEditMode ? this.cycleId! : 0,
      userId,
      startDate: startDate,  // Keep as Date object
      endDate: endDate,      // Keep as Date object
      notes: this.cycleForm.value.notes || '',
      symptoms: symptoms
    };
    
    console.log('=== FINAL COMPONENT DATA ===');
    console.log('Final cycle data:', cycleData);
    console.log('Symptoms to send:', cycleData.symptoms);
    
    // Create or update
    const request = this.isEditMode ?
      this.cycleService.updateCycle(this.cycleId!, cycleData) :
      this.cycleService.createCycle(cycleData);
      
    request.subscribe({
      next: (response) => {
        console.log('Success response:', response);
        this.isLoading = false;
        this.snackBar.open('Cycle saved', 'Close', { duration: 3000 });
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Error details:', err);
        this.isLoading = false;
        
        // Show more detailed error message
        if (err.status === 400 && err.error) {
          if (typeof err.error === 'string') {
            this.errorMessage = err.error;
          } else if (err.error.message) {
            this.errorMessage = err.error.message;
          } else if (err.error.errors) {
            // Handle .NET Core validation errors
            const validationErrors = Object.values(err.error.errors).flat();
            this.errorMessage = validationErrors.join(', ');
          } else {
            this.errorMessage = 'Invalid data. Please check your input.';
          }
        } else {
          this.errorMessage = 'Failed to save cycle. Please try again.';
        }
      }
    });
  }
}