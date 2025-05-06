import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Symptom } from '../models/Symptom';

/**
 * DTO for creating a new symptom entry linked to a period cycle.
 * `date` should be formatted as "YYYY-MM-DD" for the backend.
 */
export interface CreateCycleSymptomDto {
  cycleId:   number;
  symptomId: number;
  intensity: number;
  date:      string;  // "YYYY-MM-DD"
}

//Models a symptom record retrieved from the API
export interface CycleSymptom {
  cycleSymptomId: number;
  cycleId:        number;
  symptomId:      number;
  intensity:      number;
  date:           string;
  createdAt:      string;
  symptom?:       Symptom; 
}

/**
 * Service to manage CRUD operations for CycleSymptom entities.
 * Communicates with the backend's /api/CycleSymptom endpoints.
 */
@Injectable({ providedIn: 'root' })
export class CycleSymptomService {
  // Point directly at your backend API
  private baseUrl = 'http://localhost:5113/api/CycleSymptom';

  constructor(private http: HttpClient) {}

  //Sends a POST to create a new CycleSymptom record
  createCycleSymptom(dto: CreateCycleSymptomDto): Observable<CycleSymptom> {
    return this.http.post<CycleSymptom>(this.baseUrl, dto);
  }

  //Retrieves all CycleSymptom entries for a given cycle ID
  getCycleSymptomsByCycleId(cycleId: number): Observable<CycleSymptom[]> {
    return this.http.get<CycleSymptom[]>(`${this.baseUrl}/cycle/${cycleId}`);
  }
}