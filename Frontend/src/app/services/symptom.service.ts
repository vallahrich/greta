//SymptomService fetches the list of available symptoms from the backend

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
  
  constructor(private http: HttpClient) { }
  
  getAllSymptoms(): Observable<Symptom[]> {
    return this.http.get<Symptom[]>(this.apiUrl).pipe(
      catchError(error => {
        console.error('Error fetching symptoms:', error);
        return throwError(() => error);
      })
    );
  }
}