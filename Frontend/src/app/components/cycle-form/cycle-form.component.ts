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

import { AuthService } from '../../services/auth.service';
import { PeriodCycleService } from '../../services/periodcycle.service';
import { SymptomService } from '../../services/symptom.service';
import { CycleSymptomService, CreateCycleSymptomDto } from '../../services/cyclesymptom.service';

import { Periodcycle } from '../../models/Periodcycle';
import { Symptom } from '../../models/Symptom';

@Component({
  selector: 'app-cycle-form',
  standalone: true,
  imports: [
    HttpClientModule,
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
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
  @ViewChild('deleteDialog') deleteDialog!: TemplateRef<any>;

  // ← added so template bindings compile
  isEditMode: boolean = false;

  cycleForm!: FormGroup;
  allSymptoms: Symptom[] = [];
  isLoading = false;
  errorMessage = '';

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
    this.cycleForm = this.fb.group({
      cycleId:   [0],
      startDate: [null, Validators.required],
      endDate:   [null, Validators.required],
      notes:     [''],
      symptoms:  this.fb.array([])
    }, { validators: this.dateRangeValidator });

    this.symptomService.getAllSymptoms().subscribe({
      next: (syms: Symptom[]) => {
        this.allSymptoms = syms;
        syms.forEach(s => {
          const group = this.fb.group({
            symptomId: [s.symptomId],
            selected:  [false],
            intensity: [{ value: 1, disabled: true }, [Validators.min(1), Validators.max(5)]]
          });
          group.get('selected')!.valueChanges.subscribe(sel => {
            sel
              ? group.get('intensity')!.enable({ emitEvent: false })
              : group.get('intensity')!.disable({ emitEvent: false });
          });
          this.symptoms.push(group);
        });
      },
      error: () => this.errorMessage = 'Failed to load symptoms'
    });
  }

  get symptoms(): FormArray {
    return this.cycleForm.get('symptoms') as FormArray;
  }

  private dateRangeValidator(group: FormGroup) {
    const start = group.get('startDate')!.value;
    const end   = group.get('endDate')!.value;
    return start && end && end < start ? { dateRange: true } : null;
  }

  cancel(): void {
    this.location.back();
  }

  openDeleteConfirmation(): void {
    this.dialog.open(this.deleteDialog)
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) this.deleteCycle();
      });
  }

  saveCycle(): void {
    if (this.cycleForm.invalid) return;
    this.isLoading = true;

    const userId = this.auth.getUserId()!;
    const { cycleId, startDate, endDate, notes } = this.cycleForm.value;
    const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    const cycle: Periodcycle = {
      cycleId,
      userId,
      startDate,
      endDate,
      notes,
      duration,
      createdAt: new Date()
    };

    this.periodCycleService.createCycle(cycle).subscribe({
      next: (saved: Periodcycle) => {
        const links: CreateCycleSymptomDto[] = this.symptoms.controls
          .map(ctrl => ctrl.value)
          .filter((c: any) => c.selected)
          .map((c: any) => ({
            cycleId:   saved.cycleId,
            symptomId: Number(c.symptomId),
            intensity: c.intensity,
            date:      startDate.toISOString().split('T')[0]
          }));

        if (links.length === 0) {
          this.finishSave();
        } else {
          let done = 0;
          links.forEach(dto =>
            this.cycleSymptomService.createCycleSymptom(dto).subscribe({
              next: () => {
                if (++done === links.length) this.finishSave();
              },
              error: err => {
                console.error('Error saving symptom link', err);
                this.errorMessage = 'Error saving symptoms';
                this.isLoading = false;
              }
            })
          );
        }
      },
      error: err => {
        console.error('Error creating cycle', err);
        this.errorMessage = 'Error saving cycle';
        this.isLoading = false;
      }
    });
  }

  private finishSave(): void {
    this.snack.open('Cycle saved', 'Close', { duration: 3000 });
    this.location.back();
  }

  private deleteCycle(): void {
    const id = this.cycleForm.value.cycleId;
    this.periodCycleService.deleteCycle(id, this.auth.getUserId()!)
      .subscribe({
        next: () => {
          this.snack.open('Deleted', 'Close', { duration: 2000 });
          this.location.back();
        },
        error: err => {
          console.error('Error deleting cycle', err);
          this.errorMessage = 'Delete failed';
          this.isLoading = false;
        }
      });
  }
}
