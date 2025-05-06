import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { Router } from '@angular/router';

interface LoginResponse {
  userId?: number;
  name?: string;
  email: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = `${environment.apiUrl}/auth`;

  // Observable to track authentication state
  private authStateSubject = new BehaviorSubject<boolean>(this.isAuthenticated);
  authState$ = this.authStateSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.checkTokenExpiration();
  }

  /**
   * Login with email and password
   * Returns full HttpResponse so we can read the Authorization header
   */
  login(email: string, password: string): Observable<LoginResponse> {
    const loginRequest: LoginRequest = { email, password };

    return this.http.post<LoginResponse>(
      `${this.baseUrl}/login`,
      loginRequest,
      { observe: 'response' }
    ).pipe(
      tap(resp => {
        const header = resp.headers.get('Authorization');
        if (header) {
          localStorage.setItem('authHeader', header);
          localStorage.setItem('isAuthenticated', 'true');
          localStorage.setItem('userEmail', email);

          // store body info
          const body = resp.body!;
          if (body.userId)  localStorage.setItem('userId',  body.userId.toString());
          if (body.name)    localStorage.setItem('userName', body.name);
        }
        this.authStateSubject.next(true);
      }),
      map(resp => resp.body!),  // unwrap to just the JSON
      catchError(error => {
        console.error('Login error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Register a new user
   */
  register(registerData: RegisterRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, registerData)
      .pipe(
        catchError(error => {
          console.error('Registration error:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Logout the current user
   */
  logout(): void {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('authHeader');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');

    this.authStateSubject.next(false);
    this.router.navigate(['/login']);
  }

  /**
   * Check if the user is authenticated
   */
  get isAuthenticated(): boolean {
    return localStorage.getItem('isAuthenticated') === 'true';
  }

  /**
   * Get the current user's email
   */
  getUserEmail(): string | null {
    return localStorage.getItem('userEmail');
  }

  /**
   * Get the current user's ID
   */
  getUserId(): number | null {
    const id = localStorage.getItem('userId');
    return id ? parseInt(id, 10) : null;
  }

  /**
   * Check if token has expired and update state
   */
  private checkTokenExpiration(): void {
    if (!this.isAuthenticated) {
      this.authStateSubject.next(false);
    }
  }
}
