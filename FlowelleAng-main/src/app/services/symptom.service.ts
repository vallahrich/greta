import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Symptom } from '../models/symptom';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SymptomService {
  private baseUrl = `${environment.apiUrl}/symptom`;
  
  constructor(private http: HttpClient) { }
  
  getAllSymptoms(): Observable<Symptom[]> {
    return this.http.get<Symptom[]>(this.baseUrl);
  }
  
  getSymptomById(id: number): Observable<Symptom> {
    return this.http.get<Symptom>(`${this.baseUrl}/${id}`);
  }
  
  createSymptom(symptom: Symptom): Observable<Symptom> {
    return this.http.post<Symptom>(this.baseUrl, symptom);
  }
  
  updateSymptom(symptom: Symptom): Observable<any> {
    return this.http.put(this.baseUrl, symptom);
  }
  
  deleteSymptom(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
}