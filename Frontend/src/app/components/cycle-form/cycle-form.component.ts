/**
 * Cycle Form Component - Add or edit period cycles
 * 
 * This component provides:
 * - Form for creating new cycles with start/end dates and notes
 * - Symptom selection with intensity rating
 * - Editing existing cycles and symptoms
 */
import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule} from '@angular/forms';

// Angular Material modules for form UI and feedback
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';

// App-specific services and models
import { AuthService } from '../../services/auth.service';
import { PeriodCycleService } from '../../services/periodcycle.service';
import { SymptomService } from '../../services/symptom.service';
import { CycleSymptomService } from '../../services/cyclesymptom.service';

import { Periodcycle } from '../../models/Periodcycle';
import { Symptom } from '../../models/Symptom';
import { CreateCycleSymptomDto } from '../../models/CycleSymptom';
import { NavFooterComponent } from '../shared/nav-footer.component';

/**
 * Component for creating or editing a menstrual cycle along with associated symptoms.
 * Uses reactive forms to bind cycle dates, notes, and symptom selections.
 */
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
    MatDividerModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    NavFooterComponent
  ],
  templateUrl: './cycle-form.component.html',
  styleUrls: ['./cycle-form.component.css']
})
export class CycleFormPageComponent implements OnInit {
  isEditMode = false; // Flag for edit vs. create; used in template
  cycleId: number | null = null;

  cycleForm!: FormGroup;          // Reactive form group for cycle input
  allSymptoms: Symptom[] = [];    // Loaded list of available symptoms
  isLoading = false;              // Spinner flag during save/delete
  errorMessage = '';              // Display errors to user

  // Datepicker constraints
  minDate = new Date(2000, 0, 1);
  maxDate = new Date();

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private location: Location,
    private route: ActivatedRoute,
    private periodCycleService: PeriodCycleService,
    private symptomService: SymptomService,
    private cycleSymptomService: CycleSymptomService,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Build form with validators and custom date-range validator
    this.cycleForm = this.fb.group({
      cycleId:   [0],
      startDate: [null, Validators.required],
      endDate:   [null, Validators.required],
      notes:     [''],
      symptoms:  this.fb.array([]) // FormArray for symptom checkboxes
    }, { validators: this.dateRangeValidator });

    // Check if we're editing an existing cycle
    this.route.params.subscribe(params => {
      if (params['cycle_id']) {
        this.isEditMode = true;
        this.cycleId = +params['cycle_id'];
      }
    });

    // Load symptom definitions and initialize controls
    this.loadSymptoms();
  }

  /**
   * Loads the list of symptoms and initializes form controls for each symptom
   */
  private loadSymptoms(): void {
    this.symptomService.getAllSymptoms().subscribe({
      next: syms => {
        this.allSymptoms = syms;
        syms.forEach(s => {
          const group = this.fb.group({
            symptomId: [s.symptomId],
            selected:  [false],
            intensity: [{ value: 1, disabled: true }, [Validators.min(1), Validators.max(5)]]
          });
          // Enable intensity input only when symptom is selected
          group.get('selected')!.valueChanges.subscribe(sel =>
            sel ? group.get('intensity')!.enable({ emitEvent: false })
                : group.get('intensity')!.disable({ emitEvent: false })
          );
          this.symptoms.push(group);
        });
        
        // If editing, load the cycle after symptoms are initialized
        if (this.isEditMode && this.cycleId) {
          this.loadCycle(this.cycleId);
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
  private loadCycle(cycleId: number): void {
    const userId = this.auth.getUserId();
    if (!userId) {
      this.errorMessage = 'User authentication error. Please log in again.';
      return;
    }

    this.isLoading = true;
    this.periodCycleService.getCyclesByUserId(userId).subscribe({
      next: cycles => {
        const cycle = cycles.find(c => c.cycleId === cycleId);
        if (cycle) {
          this.cycleForm.patchValue({
            cycleId: cycle.cycleId,
            startDate: new Date(cycle.startDate),
            endDate: new Date(cycle.endDate),
            notes: cycle.notes || ''
          });
          
          // Load symptoms
          this.loadCycleSymptoms(cycleId);
        } else {
          this.errorMessage = 'Cycle not found';
          this.isLoading = false;
        }
      },
      error: err => {
        console.error('Error loading cycle:', err);
        this.errorMessage = 'Failed to load cycle data';
        this.isLoading = false;
      }
    });
  }
  
  /**
   * Loads symptoms associated with a cycle and sets form values
   */
  private loadCycleSymptoms(cycleId: number): void {
    this.cycleSymptomService.getCycleSymptomsByCycleId(cycleId).subscribe({
      next: symptoms => {
        // For each symptom in the cycle, set corresponding checkbox and intensity
        symptoms.forEach(cs => {
          const index = this.allSymptoms.findIndex(s => s.symptomId === cs.symptomId);
          if (index !== -1 && index < this.symptoms.controls.length) {
            const control = this.symptoms.at(index);
            control.get('selected')?.setValue(true);
            control.get('intensity')?.setValue(cs.intensity);
          }
        });
        this.isLoading = false;
      },
      error: err => {
        console.error('Error loading cycle symptoms:', err);
        this.isLoading = false;
      }
    });
  }

  // Convenience getter for the FormArray of symptom controls
  get symptoms(): FormArray {
    return this.cycleForm.get('symptoms') as FormArray;
  }

  /**
   * Custom validator to ensure endDate >= startDate.
   */
  private dateRangeValidator(group: FormGroup) {
    const start = group.get('startDate')!.value;
    const end   = group.get('endDate')!.value;
    return start && end && end < start ? { dateRange: true } : null;
  }

  /**
   * Cancel and navigate back to the previous page
   */
  cancel(): void {
    this.location.back();
  }

  /**
   * Saves the cycle and its symptom links to the server
   * Uses createCycle for new cycles and updateCycle for existing ones
   */
  saveCycle(): void {
    if (this.cycleForm.invalid) return;
    this.isLoading = true;
  
    const userId = this.auth.getUserId();
    if (!userId) {
      this.errorMessage = 'User authentication error. Please log in again.';
      this.isLoading = false;
      return;
    }
  
    // Get cycle data from form
    const { startDate, endDate, notes } = this.cycleForm.value;
    const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000*60*60*24)) + 1;
  
    const cycle: Periodcycle = { 
      cycleId: this.isEditMode ? this.cycleId! : 0, 
      userId, 
      startDate, 
      endDate, 
      notes, 
      duration, 
      createdAt: new Date() 
    };
  
    // Get selected symptoms
    const selectedSymptoms = this.symptoms.controls
      .filter(c => c.value.selected)
      .map(c => ({
        symptomId: c.value.symptomId,
        intensity: c.value.intensity
      }));
  
    // For new cycles, use existing create method
    if (!this.isEditMode) {
      this.periodCycleService.createCycle(cycle).subscribe({
        next: saved => {
          // Use the correct method for creating symptoms
          this.createSelectedSymptoms(saved.cycleId, startDate, selectedSymptoms);
        },
        error: err => this.handleError('Error creating cycle', err)
      });
      return;
    }
  
    // For editing, use the new endpoint that handles both cycle and symptoms
    this.periodCycleService.updateCycleWithSymptoms(this.cycleId!, {
      cycle: cycle,
      selectedSymptoms: selectedSymptoms
    }).subscribe({
      next: () => {
        this.snack.open('Cycle updated', 'Close', { duration: 3000 });
        this.location.back();
      },
      error: err => this.handleError('Error updating cycle', err)
    });
  }
  /**
   * Common error handler
   */
  private handleError(message: string, err: any): void {
    console.error(message, err);
    this.errorMessage = message;
    this.isLoading = false;
  }

  /**
   * Show snackbar and navigate back after successful save
   */
  private finishSave(): void {
    this.snack.open('Cycle saved', 'Close', { duration: 3000 });
    this.location.back();
  }
}