/**
 * Cycle Form Component - Add or edit period cycles
 * 
 * This component provides:
 * - Form for creating new cycles with start/end dates and notes
 * - Symptom selection with intensity rating
 * - Editing existing cycles and symptoms
 * - Deletion of cycles with confirmation
 * 
 * It handles the core data entry functionality of the app.
 */
import { Component, OnInit, TemplateRef, ViewChild, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule} from '@angular/forms';

// Angular Material modules
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';

// App services and models
import { AuthService } from '../../services/auth.service';
import { PeriodCycleService } from '../../services/periodcycle.service';
import { SymptomService } from '../../services/symptom.service';
import { CycleSymptomService } from '../../services/cyclesymptom.service';
import { Periodcycle } from '../../models/Periodcycle';
import { Symptom } from '../../models/Symptom';
import { CreateCycleSymptomDto } from '../../models/CycleSymptom';
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
    MatDividerModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    NavFooterComponent
  ],
  templateUrl: './cycle-form.component.html',
  styleUrls: ['./cycle-form.component.css']
})
export class CycleFormPageComponent implements OnInit, OnChanges {
  // Route parameter bound automatically via withComponentInputBinding
  @Input() cycle_id?: string;
  
  // Reference to delete confirmation dialog template
  @ViewChild('deleteDialog') deleteDialog!: TemplateRef<any>;

  // Mode flag (edit existing vs create new)
  isEditMode = false;
  cycleId: number | null = null;

  // Form and data
  cycleForm!: FormGroup;          // Main form for cycle data
  allSymptoms: Symptom[] = [];    // Available symptoms to select
  
  // UI state
  isLoading = false;              // Loading state
  errorMessage = '';              // Error display

  // Date constraints for the date picker
  minDate = new Date(2000, 0, 1); // Earliest allowed date
  maxDate = new Date();           // Latest allowed date (today)

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private location: Location,
    private periodCycleService: PeriodCycleService,
    private symptomService: SymptomService,
    private cycleSymptomService: CycleSymptomService,
    private snack: MatSnackBar,
    private dialog: MatDialog
  ) {}

  /**
   * Lifecycle hook that runs when input properties change
   * Detects changes to the cycle_id route parameter
   */
  ngOnChanges(changes: SimpleChanges): void {
    // Check if cycle_id input changed and is not undefined
    if (changes['cycle_id'] && this.cycle_id) {
      this.isEditMode = true;
      this.cycleId = +this.cycle_id; // Convert string to number
      
      // If form is already initialized, load the cycle
      if (this.cycleForm && this.allSymptoms.length > 0) {
        this.loadCycle(this.cycleId);
      }
    }
  }

  /**
   * Lifecycle hook that runs on component initialization
   * Sets up the form and loads data
   */
  ngOnInit(): void {
    // Build form with validators and custom validation
    this.cycleForm = this.fb.group({
      cycleId:   [0],
      startDate: [null, Validators.required],
      endDate:   [null, Validators.required],
      notes:     [''],
      symptoms:  this.fb.array([]) // Dynamic array for symptoms
    }, { validators: this.dateRangeValidator });

    // Check if we're editing based on Input property
    if (this.cycle_id) {
      this.isEditMode = true;
      this.cycleId = +this.cycle_id;
    }

    // Load symptom definitions and initialize form controls
    this.loadSymptoms();
  }

  /**
   * Loads the list of available symptoms and adds form controls for each
   */
  private loadSymptoms(): void {
    this.symptomService.getAllSymptoms().subscribe({
      next: syms => {
        this.allSymptoms = syms;
        syms.forEach(s => {
          // Create a form group for each symptom with selection and intensity
          const group = this.fb.group({
            symptomId: [s.symptomId],
            selected:  [false],
            intensity: [{ value: 1, disabled: true }, [Validators.min(1), Validators.max(5)]]
          });
          
          // Enable/disable intensity based on selection
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
   * 
   * @param cycleId ID of the cycle to load
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
        // Find the cycle by ID in the user's cycles
        const cycle = cycles.find(c => c.cycleId === cycleId);
        if (cycle) {
          // Populate form with cycle data
          this.cycleForm.patchValue({
            cycleId: cycle.cycleId,
            startDate: new Date(cycle.startDate),
            endDate: new Date(cycle.endDate),
            notes: cycle.notes || ''
          });
          
          // Load symptoms for this cycle
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
   * Loads symptoms associated with a cycle
   * 
   * @param cycleId ID of the cycle
   */
  private loadCycleSymptoms(cycleId: number): void {
    this.cycleSymptomService.getCycleSymptomsByCycleId(cycleId).subscribe({
      next: symptoms => {
        // For each symptom in the cycle, update form controls
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

  // Convenience getter for the symptoms FormArray
  get symptoms(): FormArray {
    return this.cycleForm.get('symptoms') as FormArray;
  }

  /**
   * Custom validator to ensure end date is not before start date
   * 
   * @param group Form group to validate
   * @returns Validation error object or null if valid
   */
  private dateRangeValidator(group: FormGroup) {
    const start = group.get('startDate')!.value;
    const end   = group.get('endDate')!.value;
    return start && end && end < start ? { dateRange: true } : null;
  }

  /**
   * Cancels form and navigates back
   */
  cancel(): void {
    this.location.back();
  }

  /**
   * Opens confirmation dialog before deleting a cycle
   */
  openDeleteConfirmation(): void {
    this.dialog.open(this.deleteDialog)
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) this.deleteCycle();
      });
  }

  /**
   * Saves the cycle and its associated symptoms
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

    // Extract form values
    const { cycleId, startDate, endDate, notes } = this.cycleForm.value;
    
    // Calculate duration (inclusive of start and end dates)
    const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000*60*60*24)) + 1;

    // Build cycle object
    const cycle: Periodcycle = { 
      cycleId: this.isEditMode ? this.cycleId! : 0, 
      userId, 
      startDate, 
      endDate, 
      notes, 
      duration, 
      createdAt: new Date() 
    };

    // Save cycle, then save symptoms
    this.periodCycleService.createCycle(cycle).subscribe({
      next: saved => this.saveSymptoms(saved.cycleId, startDate),
      error: err => this.handleError('Error saving cycle', err)
    });
  }

  /**
   * Saves selected symptoms after cycle is created
   * 
   * @param cycleId ID of the saved cycle
   * @param date Date to use for symptoms
   */
  private saveSymptoms(cycleId: number, date: Date): void {
    // Extract selected symptoms from form
    const links: CreateCycleSymptomDto[] = this.symptoms.controls
      .map(c => c.value)
      .filter((c:any) => c.selected)
      .map((c:any) => ({ 
        cycleId, 
        symptomId: c.symptomId, 
        intensity: c.intensity, 
        date: date.toISOString().slice(0,10) // Format YYYY-MM-DD 
      }));

    // If no symptoms selected, complete save process
    if (!links.length) return this.finishSave();

    // Save each symptom
    let done = 0;
    links.forEach(dto =>
      this.cycleSymptomService.createCycleSymptom(dto).subscribe({
        next: () => { 
          // When all symptoms are saved, finish
          if (++done === links.length) this.finishSave(); 
        },
        error: err => this.handleError('Error saving symptoms', err)
      })
    );
  }

  /**
   * Common error handler
   * 
   * @param message User-friendly error message
   * @param err Error object
   */
  private handleError(message: string, err: any): void {
    console.error(message, err);
    this.errorMessage = message;
    this.isLoading = false;
  }

  /**
   * Completes the save process with success notification
   */
  private finishSave(): void {
    this.snack.open('Cycle saved', 'Close', { duration: 3000 });
    this.location.back();
  }

  /**
   * Deletes the cycle and returns to previous page
   */
  private deleteCycle(): void {
    if (!this.cycleId) return;
    
    const userId = this.auth.getUserId();
    if (!userId) {
      this.errorMessage = 'User authentication error. Please log in again.';
      return;
    }
    
    this.periodCycleService.deleteCycle(this.cycleId, userId).subscribe({
      next: () => { 
        this.snack.open('Deleted', 'Close', { duration: 2000 }); 
        this.location.back(); 
      },
      error: err => this.handleError('Delete failed', err)
    });
  }
}