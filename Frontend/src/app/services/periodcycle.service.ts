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
  providedIn: 'root'
})
export class PeriodCycleService {
  private apiUrl = `${environment.apiUrl}/periodcycle`;
  
  constructor(private http: HttpClient) {}
  
  //Retrieves all period cycles belonging to a specific user
  getCyclesByUserId(userId: number): Observable<Periodcycle[]> {
    return this.http.get<Periodcycle[]>(`${this.apiUrl}/user/${userId}`).pipe(
      catchError(error => {
        console.error('Error fetching cycles:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Creates a new period cycle record in the backend.
   * Adapts Date fields to ISO strings for transmission.
   */
  createCycle(cycle: Periodcycle): Observable<Periodcycle> {
    // Helper function to preserve local date without timezone shifts
    const formatLocalDate = (date: Date): string => {
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    };

    const adaptedCycle = {
      cycleId: cycle.cycleId,
      userId: cycle.userId,
      startDate: cycle.startDate instanceof Date ? 
        formatLocalDate(cycle.startDate) : cycle.startDate,
      endDate: cycle.endDate instanceof Date ? 
        formatLocalDate(cycle.endDate) : cycle.endDate,
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
   * Updates an existing period cycle record.
   * Adapts Date fields to ISO strings for transmission.
   */
  updateCycleWithSymptoms(cycleId: number, request: any): Observable<Periodcycle> {
    // Format dates to preserve local date values
    const formatLocalDate = (date: Date): string => {
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    };

    // Clone and format the request dates
    const formattedRequest = {
      ...request,
      cycle: {
        ...request.cycle,
        startDate: request.cycle.startDate instanceof Date ? 
          formatLocalDate(request.cycle.startDate) : request.cycle.startDate,
        endDate: request.cycle.endDate instanceof Date ? 
          formatLocalDate(request.cycle.endDate) : request.cycle.endDate,
      }
    };

    return this.http.put<Periodcycle>(`${this.apiUrl}/${cycleId}/with-symptoms`, formattedRequest).pipe(
      catchError(error => {
        console.error('Error updating cycle with symptoms:', error);
        return throwError(() => error);
      })
    );
  }
  
  //Deletes a period cycle for a given user
  deleteCycle(id: number, userId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}/user/${userId}`).pipe(
      catchError(error => {
        console.error('Error deleting cycle:', error);
        return throwError(() => error);
      })
    );
  }
}