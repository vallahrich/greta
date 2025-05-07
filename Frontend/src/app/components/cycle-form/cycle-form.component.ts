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
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import {  FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule} from '@angular/forms';

// Angular Material modules for form UI and feedback
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

// App-specific services and models
import { AuthService } from '../../services/auth.service';
import { PeriodCycleService } from '../../services/periodcycle.service';
import { SymptomService } from '../../services/symptom.service';
import { CycleSymptomService } from '../../services/cyclesymptom.service';

import { Periodcycle } from '../../models/Periodcycle';
import { Symptom } from '../../models/Symptom';
import { CreateCycleSymptomDto, CycleSymptom } from '../../models/CycleSymptom';
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
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    NavFooterComponent
  ],
  templateUrl: './cycle-form.component.html',
  styleUrls: ['./cycle-form.component.css']
})
export class CycleFormPageComponent implements OnInit {
  // Reference to the delete confirmation dialog template
  @ViewChild('deleteDialog') deleteDialog!: TemplateRef<any>;

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
    private snack: MatSnackBar,
    private dialog: MatDialog
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
        this.loadCycle(this.cycleId);
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

    const { startDate, endDate, notes } = this.cycleForm.value;
    // Compute duration inclusive of start and end
    const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000*60*60*24)) + 1;

    // Build cycle DTO
    const cycle: Periodcycle = { 
      cycleId: this.isEditMode ? this.cycleId! : 0, 
      userId, 
      startDate, 
      endDate, 
      notes, 
      duration, 
      createdAt: new Date() 
    };

    // Use the appropriate service method based on whether we're editing or creating
    const saveObservable = this.isEditMode 
      ? this.periodCycleService.updateCycle(cycle) 
      : this.periodCycleService.createCycle(cycle);

    saveObservable.subscribe({
      next: saved => {
        // If updating, use the existing cycleId
        const savedCycleId = this.isEditMode ? this.cycleId! : saved.cycleId;
        
        // First delete existing symptoms if editing (to avoid duplicates)
        if (this.isEditMode) {
          this.handleExistingSymptoms(savedCycleId, startDate);
        } else {
          // For new cycles, just save the symptoms
          this.saveSymptoms(savedCycleId, startDate);
        }
      },
      error: err => this.handleError('Error saving cycle', err)
    });
  }

  /**
   * Handles existing symptoms when editing a cycle
   * 1. Gets existing symptoms
   * 2. Deletes them one by one
   * 3. Then creates the new symptoms
   */
  private handleExistingSymptoms(cycleId: number, date: Date): void {
    // Get selected symptoms from form
    const selectedSymptoms = this.symptoms.controls
      .map(c => c.value)
      .filter((c: any) => c.selected)
      .map((c: any) => ({
        symptomId: c.symptomId,
        intensity: c.intensity
      }));
  
    // First get all existing symptoms
    this.cycleSymptomService.getCycleSymptomsByCycleId(cycleId).subscribe({
      next: existingSymptoms => {
        // Track operations for completion
        let totalOperations = 0;
        let completedOperations = 0;
        const updateQueue: CycleSymptom[] = [];
        const createQueue: CreateCycleSymptomDto[] = [];
        
        // Find symptoms to update (exist in DB and are still selected)
        selectedSymptoms.forEach(selected => {
          const existing = existingSymptoms.find(e => e.symptomId === selected.symptomId);
          
          if (existing) {
            // Update intensity if changed
            if (existing.intensity !== selected.intensity) {
              updateQueue.push({
                ...existing,
                intensity: selected.intensity
              });
            }
          } else {
            // This is a new symptom, add to create queue
            createQueue.push({
              cycleId,
              symptomId: selected.symptomId,
              intensity: selected.intensity,
              date: date.toISOString().split('T')[0] // Fix for date issue
            });
          }
        });
        
        // Find symptoms to delete (in DB but not selected anymore)
        const deleteQueue = existingSymptoms.filter(existing => 
          !selectedSymptoms.some(s => s.symptomId === existing.symptomId)
        );
  
        // Calculate total operations
        totalOperations = updateQueue.length + createQueue.length + deleteQueue.length;
        
        // If no operations needed, we're done
        if (totalOperations === 0) {
          this.finishSave();
          return;
        }
  
        // Process updates
        updateQueue.forEach(symptom => {
          this.cycleSymptomService.updateCycleSymptom(symptom).subscribe({
            next: () => {
              if (++completedOperations === totalOperations) this.finishSave();
            },
            error: err => this.handleError('Error updating symptom', err)
          });
        });
  
        // Process creates
        createQueue.forEach(dto => {
          this.cycleSymptomService.createCycleSymptom(dto).subscribe({
            next: () => {
              if (++completedOperations === totalOperations) this.finishSave();
            },
            error: err => this.handleError('Error creating symptom', err)
          });
        });
  
        // Process deletes
        deleteQueue.forEach(symptom => {
          this.cycleSymptomService.deleteCycleSymptom(symptom.cycleSymptomId).subscribe({
            next: () => {
              if (++completedOperations === totalOperations) this.finishSave();
            },
            error: err => this.handleError('Error deleting symptom', err)
          });
        });
      },
      error: err => {
        console.error('Error fetching existing symptoms:', err);
        // Fall back to creating all symptoms if we can't get existing ones
        this.saveSymptoms(cycleId, date);
      }
    });
  }

  /**
   * Helper to save selected symptoms after cycle is created
   */
  private saveSymptoms(cycleId: number, date: Date): void {
    const links: CreateCycleSymptomDto[] = this.symptoms.controls
      .map(c => c.value)
      .filter((c:any) => c.selected)
      .map((c:any) => ({ 
        cycleId, 
        symptomId: c.symptomId, 
        intensity: c.intensity, 
        date: date.toISOString().slice(0,10) 
      }));

    if (!links.length) return this.finishSave();

    let done = 0;
    links.forEach(dto =>
      this.cycleSymptomService.createCycleSymptom(dto).subscribe({
        next: () => { if (++done === links.length) this.finishSave(); },
        error: err => this.handleError('Error saving symptoms', err)
      })
    );
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