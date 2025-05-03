import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { Periodcycle } from '../models/Periodcycle';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PeriodCycleService {
  private baseUrl = `${environment.apiUrl}/periodcycle`;
  
  constructor(private http: HttpClient) {}
  
  getCyclesByUserId(userId: number): Observable<Periodcycle[]> {
    return this.http.get<Periodcycle[]>(`${this.baseUrl}/user/${userId}`).pipe(
      catchError(error => {
        console.error('Error fetching cycles:', error);
        return throwError(() => error);
      })
    );
  }
  
  getCycleById(id: number): Observable<Periodcycle> {
    return this.http.get<Periodcycle>(`${this.baseUrl}/${id}`).pipe(
      catchError(error => {
        console.error('Error fetching cycle:', error);
        return throwError(() => error);
      })
    );
  }
  
  createCycle(cycle: Periodcycle): Observable<Periodcycle> {
    const adaptedCycle = {
      cycleId: cycle.cycleId,
      userId: cycle.userId,
      startDate: cycle.startDate instanceof Date ? cycle.startDate.toISOString() : cycle.startDate,
      endDate: cycle.endDate instanceof Date ? cycle.endDate.toISOString() : cycle.endDate,
      notes: cycle.notes || null
    };
    
    return this.http.post<Periodcycle>(this.baseUrl, adaptedCycle).pipe(
      catchError(error => {
        console.error('Error creating cycle:', error);
        return throwError(() => error);
      })
    );
  }
  
  updateCycle(cycle: Periodcycle): Observable<any> {
    const adaptedCycle = {
      cycleId: cycle.cycleId,
      userId: cycle.userId,
      startDate: cycle.startDate instanceof Date ? cycle.startDate.toISOString() : cycle.startDate,
      endDate: cycle.endDate instanceof Date ? cycle.endDate.toISOString() : cycle.endDate,
      notes: cycle.notes || null
    };
    
    return this.http.put(this.baseUrl, adaptedCycle).pipe(
      catchError(error => {
        console.error('Error updating cycle:', error);
        return throwError(() => error);
      })
    );
  }
  
  deleteCycle(id: number, userId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}/user/${userId}`).pipe(
      catchError(error => {
        console.error('Error deleting cycle:', error);
        return throwError(() => error);
      })
    );
  }
}