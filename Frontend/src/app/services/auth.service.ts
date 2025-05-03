import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError, tap, BehaviorSubject } from 'rxjs';
import { environment } from '../environments/environment';
import { Router } from '@angular/router';

interface LoginResponse {
  headerValue: string;
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
    // Check for token expiration on service initialization
    this.checkTokenExpiration();
  }
  
  /**
   * Login with email and password
   */
  login(email: string, password: string): Observable<LoginResponse> {
    const loginRequest: LoginRequest = { email, password };
    
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, loginRequest)
      .pipe(
        tap((response: LoginResponse) => {
          if (response && response.headerValue) {
            // Store auth information in localStorage
            localStorage.setItem('authHeader', response.headerValue);
            localStorage.setItem('isAuthenticated', 'true');
            localStorage.setItem('userEmail', email);
            
            // Store user info
            if (response.userId) localStorage.setItem('userId', response.userId.toString());
            if (response.name) localStorage.setItem('userName', response.name);
            
            // Update authentication state
            this.authStateSubject.next(true);
          }
        }),
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
    // Remove all auth-related items from localStorage
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('authHeader');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    
    // Update authentication state
    this.authStateSubject.next(false);
    
    // Navigate to login page
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
    const userId = localStorage.getItem('userId');
    return userId ? parseInt(userId, 10) : null;
  }
  
  /**
   * Get the current user's name
   */
  getUserName(): string | null {
    return localStorage.getItem('userName');
  }
  
  /**
   * Get authentication headers for API requests
   */
  getAuthHeaders(): { [header: string]: string } {
    const authHeader = localStorage.getItem('authHeader');
    if (!authHeader) {
      return {};
    }
    
    return {
      'Authorization': authHeader
    };
  }
  
  /**
   * Check if token has expired and logout if it has
   */
  private checkTokenExpiration(): void {
    // Basic auth doesn't expire, but check if authenticated
    if (!this.isAuthenticated) {
      this.authStateSubject.next(false);
    }
  }
}