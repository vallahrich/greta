import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CycleSymptom } from '../models/cyclesymptom';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CycleSymptomService {
  private baseUrl = `${environment.apiUrl}/cyclesymptom`;
  
  constructor(private http: HttpClient) { }
  
  getCycleSymptomById(id: number): Observable<CycleSymptom> {
    return this.http.get<CycleSymptom>(`${this.baseUrl}/${id}`);
  }
  
  getCycleSymptomsByCycleId(cycleId: number): Observable<CycleSymptom[]> {
    return this.http.get<CycleSymptom[]>(`${this.baseUrl}/cycle/${cycleId}`);
  }
  
  getCycleSymptomsByDate(date: Date): Observable<CycleSymptom[]> {
    const formattedDate = date.toISOString().split('T')[0];
    return this.http.get<CycleSymptom[]>(`${this.baseUrl}/date/${formattedDate}`);
  }
  
  createCycleSymptom(cycleSymptom: CycleSymptom): Observable<CycleSymptom> {
    return this.http.post<CycleSymptom>(this.baseUrl, cycleSymptom);
  }
  
  updateCycleSymptom(cycleSymptom: CycleSymptom): Observable<any> {
    return this.http.put(this.baseUrl, cycleSymptom);
  }
  
  deleteCycleSymptom(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
  
  deleteCycleSymptomsByCycleId(cycleId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/cycle/${cycleId}`);
  }
}