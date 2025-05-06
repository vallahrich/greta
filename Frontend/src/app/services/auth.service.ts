// auth.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { User } from '../models/User';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Skip URL construction logic entirely - directly use absolute URLs
  private readonly BASE_URL = 'http://localhost:5113';
  
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  constructor(private http: HttpClient) {
    this.currentUserSubject = new BehaviorSubject<User | null>(
      this.getUserFromStorage()
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  private getUserFromStorage(): User | null {
    const storedUser = localStorage.getItem('currentUser');
    return storedUser ? JSON.parse(storedUser) : null;
  }

  login(email: string, password: string): Observable<any> {
    // Bypass ALL URL construction by using the direct URL from the backend controller
    const loginUrl = `${this.BASE_URL}/api/auth/login`;
    console.log(`Making login request to: ${loginUrl}`);
    
    return this.http.post<any>(
      loginUrl,
      { email, password }
    ).pipe(
      tap(response => {
        if (response) {
          localStorage.setItem('authHeader', response.token || '');
          localStorage.setItem('isAuthenticated', 'true');
          localStorage.setItem('userEmail', response.email || '');
          localStorage.setItem('userId', response.userId?.toString() || '');
          localStorage.setItem('currentUser', JSON.stringify(response));
          this.currentUserSubject.next(response);
        }
      }),
      catchError(error => {
        console.error('Login error:', error);
        return throwError(() => error);
      })
    );
  }

  register(registerData: any): Observable<any> {
    const registerUrl = `${this.BASE_URL}/api/auth/register`;
    console.log(`Making registration request to: ${registerUrl}`);
    
    return this.http.post<any>(
      registerUrl,
      registerData
    );
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authHeader');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
    this.currentUserSubject.next(null);
  }

  getUserId(): number | null {
    const id = localStorage.getItem('userId');
    return id ? parseInt(id, 10) : null;
  }

  getUserEmail(): string | null {
    return localStorage.getItem('userEmail');
  }

  isAuthenticated(): boolean {
    return !!this.currentUserValue || localStorage.getItem('isAuthenticated') === 'true';
  }
}