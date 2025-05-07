/**
 * Symptom Service - Provides access to symptom definitions
 * 
 * This service retrieves the catalog of available symptoms that users
 * can select when tracking period symptoms.
 * 
 * It's a relatively simple service since symptoms are essentially
 * reference data that doesn't change often.
 */
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../environments/environment';
import { Symptom } from '../models/Symptom';

@Injectable({
  providedIn: 'root'
})
export class SymptomService {
  private apiUrl = `${environment.apiUrl}/symptom`;
  
  constructor(private http: HttpClient) {}
  
  // Get catalog of available symptoms
  getSymptomCatalog(): Observable<Symptom[]> {
    return this.http.get<Symptom[]>(this.apiUrl).pipe(
      catchError(error => {
        console.error('Error fetching symptoms:', error);
        return throwError(() => error);
      })
    );
  }
}