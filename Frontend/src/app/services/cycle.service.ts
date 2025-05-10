/**
 * Cycle Service - Testing with PascalCase properties
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
  
  private formatLocalDate(date: Date): string {
    const result = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return result;
  }
  
  getUserCycles(): Observable<CycleWithSymptoms[]> {
    return this.http.get<CycleWithSymptoms[]>(this.apiUrl);
  }
  
  /**
   * Test with PascalCase properties to match C# DTOs
   */
  createCycle(cycle: CycleWithSymptoms): Observable<CycleWithSymptoms> {
    console.log('=== TEST: CREATE WITH PASCALCASE ===');
    
    // Try PascalCase property names to match C# DTOs
    const formattedCycle = {
      CycleId: cycle.cycleId,
      UserId: cycle.userId,
      StartDate: cycle.startDate instanceof Date ? 
        this.formatLocalDate(cycle.startDate) : cycle.startDate,
      EndDate: cycle.endDate instanceof Date ? 
        this.formatLocalDate(cycle.endDate) : cycle.endDate,
      Notes: cycle.notes,
      Symptoms: cycle.symptoms.map(s => ({
        SymptomId: s.symptomId,
        Name: s.name,
        Intensity: s.intensity,
        Date: s.date instanceof Date ? this.formatLocalDate(s.date) : s.date
      }))
    };
    
    console.log('PascalCase JSON to send:', JSON.stringify(formattedCycle));
    
    return this.http.post<CycleWithSymptoms>(this.apiUrl, formattedCycle).pipe(
      tap(response => console.log('Success with PascalCase!')),
      catchError(error => {
        console.error('Error with PascalCase:', error);
        
        // If PascalCase fails, try camelCase as fallback
        console.log('=== FALLBACK: TRYING CAMELCASE ===');
        const camelCaseData = {
          cycleId: cycle.cycleId,
          userId: cycle.userId,
          startDate: cycle.startDate instanceof Date ? 
            this.formatLocalDate(cycle.startDate) : cycle.startDate,
          endDate: cycle.endDate instanceof Date ? 
            this.formatLocalDate(cycle.endDate) : cycle.endDate,
          notes: cycle.notes,
          symptoms: cycle.symptoms.map(s => ({
            symptomId: s.symptomId,
            name: s.name,
            intensity: s.intensity,
            date: s.date instanceof Date ? this.formatLocalDate(s.date) : s.date
          }))
        };
        
        console.log('camelCase JSON to send:', JSON.stringify(camelCaseData));
        
        return this.http.post<CycleWithSymptoms>(this.apiUrl, camelCaseData).pipe(
          tap(response => console.log('Success with camelCase!')),
          catchError(err => {
            console.error('Error with both cases:', err);
            return throwError(() => err);
          })
        );
      })
    );
  }
  
  updateCycle(id: number, cycle: CycleWithSymptoms): Observable<CycleWithSymptoms> {
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
    
    return this.http.put<CycleWithSymptoms>(`${this.apiUrl}/${id}`, formattedCycle);
  }
  
  deleteCycle(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}