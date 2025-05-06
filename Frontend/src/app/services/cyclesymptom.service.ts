/**
 * Service to manage CRUD operations for CycleSymptom entities.
 * Communicates with the backend's /api/CycleSymptom endpoints.
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

  //Sends a POST to create a new CycleSymptom record
  createCycleSymptom(dto: CreateCycleSymptomDto): Observable<CycleSymptom> {
    return this.http.post<CycleSymptom>(this.apiUrl, dto).pipe(
      catchError(error => {
        console.error('Error creating cycle symptom:', error);
        return throwError(() => error);
      })
    );
  }

  //Retrieves all CycleSymptom entries for a given cycle ID
  getCycleSymptomsByCycleId(cycleId: number): Observable<CycleSymptom[]> {
    return this.http.get<CycleSymptom[]>(`${this.apiUrl}/cycle/${cycleId}`).pipe(
      catchError(error => {
        console.error('Error fetching cycle symptoms:', error);
        return throwError(() => error);
      })
    );
  }
}