import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { Periodcycle } from '../models/Periodcycle';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PeriodCycleService {
  private baseUrl = `${environment.apiUrl}/periodcycle`;
  
  constructor(private http: HttpClient) {
    console.log('PeriodCycleService using baseUrl:', this.baseUrl);
  }
  
  getCyclesByUserId(userId: number): Observable<Periodcycle[]> {
    console.log(`Getting cycles for user ID: ${userId}`);
    return this.http.get<Periodcycle[]>(`${this.baseUrl}/user/${userId}`).pipe(
      catchError(error => {
        console.error('Error fetching cycles:', error);
        return throwError(() => error);
      })
    );
  }
  
  getCycleById(id: number): Observable<Periodcycle> {
    console.log(`Getting cycle with ID: ${id}`);
    return this.http.get<Periodcycle>(`${this.baseUrl}/${id}`).pipe(
      catchError(error => {
        console.error('Error fetching cycle:', error);
        return throwError(() => error);
      })
    );
  }
  
  createCycle(cycle: Periodcycle): Observable<Periodcycle> {
    // Convert dates to ISO strings for proper serialization
    const adaptedCycle = this.adaptCycleForApi(cycle);
    
    // Add content-type header to ensure proper JSON formatting
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    console.log('Creating cycle with data:', adaptedCycle);
    
    return this.http.post<Periodcycle>(`${this.baseUrl}`, adaptedCycle, { headers }).pipe(
      catchError(error => {
        console.error('Error creating cycle:', error);
        return throwError(() => error);
      })
    );
  }
  
  updateCycle(cycle: Periodcycle): Observable<any> {
    // Convert dates to ISO strings for proper serialization
    const adaptedCycle = this.adaptCycleForApi(cycle);
    
    // Add content-type header to ensure proper JSON formatting
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    console.log('Updating cycle with data:', adaptedCycle);
    
    return this.http.put(`${this.baseUrl}`, adaptedCycle, { headers }).pipe(
      catchError(error => {
        console.error('Error updating cycle:', error);
        return throwError(() => error);
      })
    );
  }
  
  deleteCycle(id: number, userId: number): Observable<any> {
    console.log(`Deleting cycle with ID: ${id} for user ID: ${userId}`);
    return this.http.delete(`${this.baseUrl}/${id}/user/${userId}`).pipe(
      catchError(error => {
        console.error('Error deleting cycle:', error);
        return throwError(() => error);
      })
    );
  }
  
  getAverageCycleDuration(userId: number): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/user/${userId}/average-duration`).pipe(
      catchError(error => {
        console.error('Error getting average cycle duration:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Adapt the cycle data format to match exactly what the API expects
   */
  private adaptCycleForApi(cycle: Periodcycle): any {
    // Create a new object with C# PascalCase property names
    // This matches exactly what the server-side model expects
    return {
      cycleId: cycle.cycle_id, 
      userId: cycle.user_id,
      startDate: cycle.start_date.toISOString(),
      endDate: cycle.end_date.toISOString(),
      notes: cycle.notes || null,
      // Don't include computed/derived properties like duration
      // These are calculated server-side
      // Only include fields that the C# model explicitly expects
    };
  }
}