import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Periodcycle } from '../models/periodcycle';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PeriodCycleService {
  private baseUrl = `${environment.apiUrl}/periodcycle`;
  
  constructor(private http: HttpClient) { }
  
  getCyclesByUserId(userId: number): Observable<Periodcycle[]> {
    return this.http.get<Periodcycle[]>(`${this.baseUrl}/user/${userId}`);
  }
  
  getCycleById(id: number): Observable<Periodcycle> {
    return this.http.get<Periodcycle>(`${this.baseUrl}/${id}`);
  }
  
  createCycle(cycle: Periodcycle): Observable<Periodcycle> {
    return this.http.post<Periodcycle>(`${this.baseUrl}`, cycle);
  }
  
  updateCycle(cycle: Periodcycle): Observable<any> {
    return this.http.put(`${this.baseUrl}`, cycle);
  }
  
  deleteCycle(id: number, userId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}/user/${userId}`);
  }
}
