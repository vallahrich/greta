import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Symptom } from '../models/Symptom';
import { environment } from '../environments/environment';

export interface CreateCycleSymptomDto {
  cycleId:   number;
  symptomId: number;
  intensity: number;
  date:      string;  // "YYYY-MM-DD"
}

export interface CycleSymptom {
  cycleSymptomId: number;
  cycleId:        number;
  symptomId:      number;
  intensity:      number;
  date:           string;
  createdAt:      string;
}

@Injectable({ providedIn: 'root' })
export class CycleSymptomService {
  // Point directly at your backend API
  private baseUrl = 'http://localhost:5113/api/CycleSymptom';

  constructor(private http: HttpClient) {}

  createCycleSymptom(dto: CreateCycleSymptomDto): Observable<CycleSymptom> {
    return this.http.post<CycleSymptom>(this.baseUrl, dto);
  }

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
  
  getSymptomsByCycleId(cycleId: number): Observable<Symptom[]> {
    return this.http.get<Symptom[]>(`${environment.apiUrl}/cyclesymptom/cycle/${cycleId}`);
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