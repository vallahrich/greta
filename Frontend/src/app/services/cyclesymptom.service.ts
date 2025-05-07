/**
 * Cycle Symptom Service - Manages symptoms associated with cycles
 * 
 * This service:
 * - Fetches symptoms for a specific cycle
 * - Creates new symptom records for a cycle
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
  // API endpoint URL
  private apiUrl = `${environment.apiUrl}/CycleSymptom`;

  constructor(private http: HttpClient) {}

  /**
   * Creates a new cycle symptom record
   * 
   * @param dto Data transfer object with cycle symptom data
   * @returns Observable of the created cycle symptom
   */
  createCycleSymptom(dto: CreateCycleSymptomDto): Observable<CycleSymptom> {
    return this.http.post<CycleSymptom>(this.apiUrl, dto).pipe(
      catchError(error => {
        console.error('Error creating cycle symptom:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Gets all symptoms for a specific cycle
   * 
   * @param cycleId The ID of the cycle
   * @returns Observable of CycleSymptom array
   */
  getCycleSymptomsByCycleId(cycleId: number): Observable<CycleSymptom[]> {
    return this.http.get<CycleSymptom[]>(`${this.apiUrl}/cycle/${cycleId}`).pipe(
      catchError(error => {
        console.error('Error fetching cycle symptoms:', error);
        return throwError(() => error);
      })
    );
  }
}