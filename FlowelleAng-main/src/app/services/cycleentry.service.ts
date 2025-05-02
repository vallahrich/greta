import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Cycleentry } from '../models/cycleentry';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CycleEntryService {
  private baseUrl = `${environment.apiUrl}/cycleentry`;

  constructor(private http: HttpClient) { }

  getEntryById(id: number): Observable<Cycleentry> {
    return this.http.get<Cycleentry>(`${this.baseUrl}/${id}`);
  }

  getEntriesByCycleId(cycleId: number): Observable<Cycleentry[]> {
    return this.http.get<Cycleentry[]>(`${this.baseUrl}/cycle/${cycleId}`);
  }

  getEntriesByCalendarId(calendarId: number): Observable<Cycleentry[]> {
    return this.http.get<Cycleentry[]>(`${this.baseUrl}/calendar/${calendarId}`);
  }

  getEntriesByDate(date: Date): Observable<Cycleentry[]> {
    const formattedDate = date.toISOString().split('T')[0];
    return this.http.get<Cycleentry[]>(`${this.baseUrl}/date/${formattedDate}`);
  }

  createEntry(entry: Cycleentry): Observable<Cycleentry> {
    return this.http.post<Cycleentry>(`${this.baseUrl}`, entry);
  }

  deleteEntry(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
}
