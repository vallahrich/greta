/**
 * Cycle Service - Fixed to exclude cycleId from create requests
 */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError, tap } from 'rxjs';
import { environment } from '../environments/environment';
import { CycleWithSymptoms } from '../models/CycleWithSymptoms';

@Injectable({ providedIn: 'root' })
export class CycleService {
  private apiUrl = `${environment.apiUrl}/cycles`;
  
  constructor(private http: HttpClient) {}
  
  /**
   * Format date to ISO 8601 format with time component
   * This ensures consistency with backend expectations
   */
  private formatDateForBackend(date: Date): string {
    // Format as YYYY-MM-DDTHH:mm:ss
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  }
  
  getUserCycles(): Observable<CycleWithSymptoms[]> {
    return this.http.get<CycleWithSymptoms[]>(this.apiUrl);
  }
  
  createCycle(cycle: CycleWithSymptoms): Observable<CycleWithSymptoms> {
    console.log('=== CREATE CYCLE ===');
    console.log('Input cycle:', cycle);
    
    // Format cycle - EXCLUDE cycleId for create operations
    const formattedCycle = {
      userId: cycle.userId,
      startDate: cycle.startDate instanceof Date ? 
        this.formatDateForBackend(cycle.startDate) : cycle.startDate,
      endDate: cycle.endDate instanceof Date ? 
        this.formatDateForBackend(cycle.endDate) : cycle.endDate,
      notes: cycle.notes || '',
      symptoms: cycle.symptoms.map(s => ({
        symptomId: s.symptomId,
        name: s.name,
        intensity: s.intensity,
        date: s.date instanceof Date ? this.formatDateForBackend(s.date) : s.date
      }))
    };
    
    console.log('Formatted cycle to send:', formattedCycle);
    console.log('JSON payload:', JSON.stringify(formattedCycle, null, 2));
    
    return this.http.post<CycleWithSymptoms>(this.apiUrl, formattedCycle).pipe(
      tap(response => {
        console.log('Create successful:', response);
      }),
      catchError(error => {
        console.error('=== HTTP ERROR DETAILS ===');
        console.error('Status:', error.status);
        console.error('Status Text:', error.statusText);
        console.error('URL:', error.url);
        if (error.error) {
          console.error('Error Body:', error.error);
        }
        if (error.message) {
          console.error('Error Message:', error.message);
        }
        console.error('Full Error Object:', error);
        console.error('========================');
        return throwError(() => error);
      })
    );
  }
  
  updateCycle(id: number, cycle: CycleWithSymptoms): Observable<CycleWithSymptoms> {
    console.log('=== UPDATE CYCLE ===');
    console.log('Cycle ID:', id);
    console.log('Input cycle:', cycle);
    
    // For update, include cycleId
    const formattedCycle = {
      cycleId: cycle.cycleId,
      userId: cycle.userId,
      startDate: cycle.startDate instanceof Date ? 
        this.formatDateForBackend(cycle.startDate) : cycle.startDate,
      endDate: cycle.endDate instanceof Date ? 
        this.formatDateForBackend(cycle.endDate) : cycle.endDate,
      notes: cycle.notes || '',
      symptoms: cycle.symptoms.map(s => ({
        symptomId: s.symptomId,
        name: s.name,
        intensity: s.intensity,
        date: s.date instanceof Date ? this.formatDateForBackend(s.date) : s.date
      }))
    };
    
    console.log('Formatted cycle to send:', formattedCycle);
    
    return this.http.put<CycleWithSymptoms>(`${this.apiUrl}/${id}`, formattedCycle).pipe(
      tap(response => {
        console.log('Update successful');
      }),
      catchError(error => {
        console.error('Update error:', error);
        return throwError(() => error);
      })
    );
  }
  
  deleteCycle(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}