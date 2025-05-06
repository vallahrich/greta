import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormArray,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { RouterModule } from '@angular/router';

import { HttpClientModule } from '@angular/common/http';

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

// App-specific services and DTOs
import { AuthService } from '../../services/auth.service';
import { PeriodCycleService } from '../../services/periodcycle.service';
import { SymptomService } from '../../services/symptom.service';
import { CycleSymptomService, CreateCycleSymptomDto } from '../../services/cyclesymptom.service';

import { Periodcycle } from '../../models/Periodcycle';
import { Symptom } from '../../models/Symptom';

/**
 * Component for creating or editing a menstrual cycle along with associated symptoms.
 * Uses reactive forms to bind cycle dates, notes, and symptom selections.
 */
@Component({
  selector: 'app-cycle-form',
  standalone: true,
  imports: [
    HttpClientModule,
    CommonModule,
    RouterModule,
    FormsModule,
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
    MatCheckboxModule
  ],
  templateUrl: './cycle-form.component.html',
  styleUrls: ['./cycle-form.component.css']
})
export class CycleFormComponent implements OnInit {
  // Reference to the delete confirmation dialog template
  @ViewChild('deleteDialog') deleteDialog!: TemplateRef<any>;

  isEditMode = false; // Flag for edit vs. create; used in template

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

    // Load symptom definitions and initialize controls
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
      },
      error: () => this.errorMessage = 'Failed to load symptoms'
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
   */
  saveCycle(): void {
    if (this.cycleForm.invalid) return;
    this.isLoading = true;

    const userId = this.auth.getUserId()!;
    const { cycleId, startDate, endDate, notes } = this.cycleForm.value;
    // Compute duration inclusive of start and end
    const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000*60*60*24));

    // Build cycle DTO
    const cycle: Periodcycle = { cycleId, userId, startDate, endDate, notes, duration, createdAt: new Date() };

    this.periodCycleService.createCycle(cycle).subscribe({
      next: saved => this.saveSymptoms(saved.cycleId, startDate),
      error: err => this.handleError('Error saving cycle', err)
    });
  }

  /**
   * Helper to save selected symptoms after cycle is created
   */
  private saveSymptoms(cycleId: number, date: Date): void {
    const links: CreateCycleSymptomDto[] = this.symptoms.controls
      .map(c => c.value)
      .filter((c:any) => c.selected)
      .map((c:any) => ({ cycleId, symptomId: c.symptomId, intensity: c.intensity, date: date.toISOString().slice(0,10) }));

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
    const id = this.cycleForm.value.cycleId;
    this.periodCycleService.deleteCycle(id, this.auth.getUserId()!).subscribe({
      next: () => { this.snack.open('Deleted', 'Close', { duration: 2000 }); this.location.back(); },
      error: err => this.handleError('Delete failed', err)
    });
  }
}