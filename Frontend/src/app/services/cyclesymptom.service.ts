/**
 * Cycle Symptom Service - Manages symptoms associated with cycles
 * 
 * This service:
 * - Fetches symptoms for a specific cycle
 * - Creates new symptom records for a cycle
 * - Deletes symptoms from a cycle
 * 
 * It handles the many-to-many relationship between cycles and symptoms.
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../environments/environment';
import { CycleSymptom, CreateCycleSymptomDto } from '../models/CycleSymptom';

@Injectable({ providedIn: 'root' })
export class CycleSymptomService {
  private apiUrl = `${environment.apiUrl}/CycleSymptom`;

  constructor(private http: HttpClient) {}

  // Sends a POST to create a new CycleSymptom record
  createCycleSymptom(dto: CreateCycleSymptomDto): Observable<CycleSymptom> {
    return this.http.post<CycleSymptom>(this.apiUrl, dto).pipe(
      catchError(error => {
        console.error('Error creating cycle symptom:', error);
        return throwError(() => error);
      })
    );
  }

  updateCycleSymptom(cycleSymptom: CycleSymptom): Observable<CycleSymptom> {
    return this.http.put<CycleSymptom>(
      `${this.apiUrl}/${cycleSymptom.cycleSymptomId}`, 
      cycleSymptom
    ).pipe(
      catchError(error => {
        console.error('Error updating cycle symptom:', error);
        return throwError(() => error);
      })
    );
  }

  // Retrieves all CycleSymptom entries for a given cycle ID
  getCycleSymptomsByCycleId(cycleId: number): Observable<CycleSymptom[]> {
    return this.http.get<CycleSymptom[]>(`${this.apiUrl}/cycle/${cycleId}`).pipe(
      catchError(error => {
        console.error('Error fetching cycle symptoms:', error);
        return throwError(() => error);
      })
    );
  }
  
  // Deletes a single CycleSymptom by its ID
  deleteCycleSymptomsByCycleId(cycleId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/cycle/${cycleId}`).pipe(
      catchError(error => {
        console.error('Error deleting cycle symptoms:', error);
        return throwError(() => error);
      })
    );
  }

  deleteCycleSymptom(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        console.error('Error deleting cycle symptom:', error);
        return throwError(() => error);
      })
    );
  }
}