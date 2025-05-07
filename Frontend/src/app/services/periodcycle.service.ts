/**
 * Period Cycle Service - Manages period cycle data with the API
 *
 * This service handles all operations related to period cycles:
 * - Fetching cycles for a user
 * - Creating new cycle records
 * - Deleting cycles
 * 
 * It communicates with the backend API's /periodcycle endpoints.
 */
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../environments/environment';
import { Periodcycle } from '../models/Periodcycle';

@Injectable({
  providedIn: 'root'  // Singleton service available app-wide
})
export class PeriodCycleService {
  // Base URL for period cycle endpoints
  private apiUrl = `${environment.apiUrl}/periodcycle`;
  
  constructor(private http: HttpClient) {}
  
  /**
   * Gets all cycles for a specific user
   * 
   * @param userId The ID of the user whose cycles to fetch
   * @returns Observable of Periodcycle array
   */
  getCyclesByUserId(userId: number): Observable<Periodcycle[]> {
    return this.http.get<Periodcycle[]>(`${this.apiUrl}/user/${userId}`).pipe(
      catchError(error => {
        console.error('Error fetching cycles:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Creates a new period cycle record
   * 
   * @param cycle The cycle data to save
   * @returns Observable of the created cycle
   */
  createCycle(cycle: Periodcycle): Observable<Periodcycle> {
    // Format dates for API (convert from Date objects to ISO strings)
    const adaptedCycle = {
      cycleId: cycle.cycleId,
      userId: cycle.userId,
      startDate: cycle.startDate instanceof Date ? cycle.startDate.toISOString() : cycle.startDate,
      endDate: cycle.endDate instanceof Date ? cycle.endDate.toISOString() : cycle.endDate,
      notes: cycle.notes || null
    };
    
    return this.http.post<Periodcycle>(this.apiUrl, adaptedCycle).pipe(
      catchError(error => {
        console.error('Error creating cycle:', error);
        return throwError(() => error);
      })
    );
  }
  
  /**
   * Deletes a period cycle
   * 
   * @param id The ID of the cycle to delete
   * @param userId The ID of the user who owns the cycle
   * @returns Observable of the HTTP response
   */
  deleteCycle(id: number, userId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}/user/${userId}`).pipe(
      catchError(error => {
        console.error('Error deleting cycle:', error);
        return throwError(() => error);
      })
    );
  }
}