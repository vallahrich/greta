import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../environments/environment';
import { CycleWithSymptoms } from '../models/CycleWithSymptoms';

@Injectable({ providedIn: 'root' })
export class CycleService {
  private apiUrl = `${environment.apiUrl}/cycles`;
  
  constructor(private http: HttpClient) {}
  
  // Get all cycles with their symptoms in one call
  getUserCycles(): Observable<CycleWithSymptoms[]> {
    return this.http.get<CycleWithSymptoms[]>(this.apiUrl).pipe(
      catchError(error => {
        console.error('Error fetching cycles:', error);
        return throwError(() => error);
      })
    );
  }
  
  // Create cycle with symptoms
  createCycle(cycle: CycleWithSymptoms): Observable<CycleWithSymptoms> {
    // Helper function to format dates properly for API
    const formatLocalDate = (date: Date): string => {
      return date.toISOString().split('T')[0];
    };
    
    // Clone and format the dates
    const formattedCycle = {
      ...cycle,
      startDate: cycle.startDate instanceof Date ? 
        formatLocalDate(cycle.startDate) : cycle.startDate,
      endDate: cycle.endDate instanceof Date ? 
        formatLocalDate(cycle.endDate) : cycle.endDate,
      symptoms: cycle.symptoms.map(s => ({
        symptomId: s.symptomId,
        name: s.name, // Changed from symptomName to name to match backend
        intensity: s.intensity,
        date: s.date instanceof Date ? formatLocalDate(s.date) : s.date
      }))
    };
    
    return this.http.post<CycleWithSymptoms>(this.apiUrl, formattedCycle).pipe(
      catchError(error => {
        console.error('Error creating cycle:', error);
        return throwError(() => error);
      })
    );
  }
  
  // Update cycle with symptoms
  updateCycle(id: number, cycle: CycleWithSymptoms): Observable<CycleWithSymptoms> {
    // Helper function to format dates properly for API
    const formatLocalDate = (date: Date): string => {
      return date.toISOString().split('T')[0];
    };
    
    // Clone and format the dates
    const formattedCycle = {
      ...cycle,
      startDate: cycle.startDate instanceof Date ? 
        formatLocalDate(cycle.startDate) : cycle.startDate,
      endDate: cycle.endDate instanceof Date ? 
        formatLocalDate(cycle.endDate) : cycle.endDate,
      symptoms: cycle.symptoms.map(s => ({
        ...s,
        date: s.date instanceof Date ? formatLocalDate(s.date) : s.date
      }))
    };
    
    return this.http.put<CycleWithSymptoms>(`${this.apiUrl}/${id}`, formattedCycle).pipe(
      catchError(error => {
        console.error('Error updating cycle:', error);
        return throwError(() => error);
      })
    );
  }
  
  // Delete cycle (backend handles cascading symptom deletion)
  deleteCycle(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        console.error('Error deleting cycle:', error);
        return throwError(() => error);
      })
    );
  }
}