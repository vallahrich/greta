/**
 * Cycle Service - Manages period cycle data operations
 * 
 * This service handles:
 * - Retrieving cycle records with symptoms
 * - Creating new cycle records
 * - Updating existing cycle records
 * - Deleting cycle records
 * 
 * It handles date formatting to ensure proper communication with the API.
 */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../environments/environment';
import { CycleWithSymptoms } from '../models/CycleWithSymptoms';

@Injectable({ providedIn: 'root' })
export class CycleService {
  private apiUrl = `${environment.apiUrl}/cycles`;
  
  constructor(private http: HttpClient) {}
  
  /**
   * Format a Date object to YYYY-MM-DD string format
   * @param date The date to format
   * @returns A string in YYYY-MM-DD format
   */
  private formatLocalDate(date: Date): string {
    // This ensures we get the date in local timezone, not UTC
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
  
  /**
   * Get all cycles with their symptoms in one call
   * @returns Observable of cycle array with symptoms
   */
  getUserCycles(): Observable<CycleWithSymptoms[]> {
    return this.http.get<CycleWithSymptoms[]>(this.apiUrl).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }
  
  /**
   * Create cycle with symptoms
   * @param cycle The cycle data to create
   * @returns Observable of the created cycle
   */
  createCycle(cycle: CycleWithSymptoms): Observable<CycleWithSymptoms> {
    // Clone and format the dates
    const formattedCycle = {
      ...cycle,
      startDate: cycle.startDate instanceof Date ? 
        this.formatLocalDate(cycle.startDate) : cycle.startDate,
      endDate: cycle.endDate instanceof Date ? 
        this.formatLocalDate(cycle.endDate) : cycle.endDate,
      symptoms: cycle.symptoms.map(s => ({
        symptomId: s.symptomId,
        name: s.name,
        intensity: s.intensity,
        date: s.date instanceof Date ? this.formatLocalDate(s.date) : s.date
      }))
    };
    
    return this.http.post<CycleWithSymptoms>(this.apiUrl, formattedCycle).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }
  
  /**
   * Update cycle with symptoms
   * @param id The cycle ID to update
   * @param cycle The updated cycle data
   * @returns Observable of the updated cycle
   */
  updateCycle(id: number, cycle: CycleWithSymptoms): Observable<CycleWithSymptoms> {
    // Clone and format the dates
    const formattedCycle = {
      ...cycle,
      startDate: cycle.startDate instanceof Date ? 
        this.formatLocalDate(cycle.startDate) : cycle.startDate,
      endDate: cycle.endDate instanceof Date ? 
        this.formatLocalDate(cycle.endDate) : cycle.endDate,
      symptoms: cycle.symptoms.map(s => ({
        ...s,
        date: s.date instanceof Date ? this.formatLocalDate(s.date) : s.date
      }))
    };
    
    return this.http.put<CycleWithSymptoms>(`${this.apiUrl}/${id}`, formattedCycle).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }
  
  /**
   * Delete cycle (backend handles cascading symptom deletion)
   * @param id The cycle ID to delete
   * @returns Observable of void
   */
  deleteCycle(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }
}