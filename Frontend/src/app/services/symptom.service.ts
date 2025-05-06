import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Symptom } from '../models/Symptom';
import { environment } from '../environments/environment';

//SymptomService fetches the list of available symptoms from the backend
@Injectable({
  providedIn: 'root'
})
export class SymptomService {
  private baseUrl = `${environment.apiUrl}/symptom`;
  
  constructor(private http: HttpClient) { }
  
  getAllSymptoms(): Observable<Symptom[]> {
    return this.http.get<Symptom[]>(this.baseUrl);
  }
}