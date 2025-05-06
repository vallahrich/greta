import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Fix the base URL to avoid duplicate path
  private apiUrl = environment.apiUrl; // No trailing /api
  
  private currentUserSubject: BehaviorSubject<any | null>;
  public currentUser: Observable<any | null>;

  constructor(private http: HttpClient) {
    this.currentUserSubject = new BehaviorSubject<any | null>(
      this.getUserFromStorage()
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): any | null {
    return this.currentUserSubject.value;
  }

  private getUserFromStorage(): any | null {
    const storedUser = localStorage.getItem('currentUser');
    return storedUser ? JSON.parse(storedUser) : null;
  }

  // Fix login URL
  login(email: string, password: string): Observable<any> {
    const loginUrl = `${this.apiUrl}/api/auth/login`;
    console.log('Login URL:', loginUrl); // Debug URL
    
    return this.http.post<any>(
      loginUrl,
      { email, password }
    ).pipe(
      tap(response => {
        if (response && response.token) {
          // Store auth data from response body
          localStorage.setItem('authHeader', response.token);
          localStorage.setItem('isAuthenticated', 'true');
          localStorage.setItem('userEmail', response.email);
          localStorage.setItem('userId', response.userId?.toString());
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

  // Keep the existing register method signature
  register(registerData: any): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/api/auth/register`,
      registerData
    );
  }

  logout(): void {
    // Remove user data from storage
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authHeader');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
    this.currentUserSubject.next(null);
  }

  // Add back missing methods used by components
  getUserId(): number | null {
    const id = localStorage.getItem('userId');
    return id ? parseInt(id, 10) : null;
  }

  getUserEmail(): string | null {
    return localStorage.getItem('userEmail');
  }

  // Change from property to method
  isAuthenticated(): boolean {
    return !!this.currentUserValue || localStorage.getItem('isAuthenticated') === 'true';
  }
}