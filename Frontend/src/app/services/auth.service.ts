/**
 * Authentication Service - Manages user authentication state
 * 
 * This service handles:
 * - User login and registration with the backend API
 * - Local storage of authentication tokens and user info
 * - Session management (checking if user is authenticated)
 * - Logout functionality
 * 
 * It's the central service for all authentication-related operations.
 */
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { User } from '../models/User';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root' // Singleton service available app-wide
})
export class AuthService {
  // Base URL for API endpoints
  private readonly BASE_URL = environment.apiUrl;
  
  // Observable source for current user data - components can subscribe to changes
  private currentUserSubject: BehaviorSubject<User | null>;
  // Public observable that components can subscribe to
  public currentUser: Observable<User | null>;

  constructor(private http: HttpClient) {
    // Initialize with user data from storage (if any)
    this.currentUserSubject = new BehaviorSubject<User | null>(
      this.getUserFromStorage()
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  // Getter for the current user value (without subscribing)
  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  // Helper to get user data from localStorage
  private getUserFromStorage(): User | null {
    const storedUser = localStorage.getItem('currentUser');
    return storedUser ? JSON.parse(storedUser) : null;
  }

  /**
   * Login - Authenticates user with email and password
   * 
   * @param email User's email address
   * @param password User's password
   * @returns Observable of the login response
   */
  login(email: string, password: string): Observable<any> {
    const loginUrl = `${this.BASE_URL}/auth/login`;
    
    return this.http.post<any>(
      loginUrl,
      { email, password }
    ).pipe(
      tap(response => {
        if (response) {
          // On successful login, store authentication data in localStorage
          localStorage.setItem('authHeader', response.token || '');
          localStorage.setItem('isAuthenticated', 'true');
          localStorage.setItem('userEmail', response.email || '');
          localStorage.setItem('userId', response.userId?.toString() || '');
          localStorage.setItem('currentUser', JSON.stringify(response));
          
          // Update the observable so subscribers get notified
          this.currentUserSubject.next(response);
        }
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Register - Creates a new user account
   * 
   * @param registerData Object with name, email, and password
   * @returns Observable of the registration response
   */
  register(registerData: any): Observable<any> {
    const registerUrl = `${this.BASE_URL}/auth/register`;
    
    return this.http.post<any>(
      registerUrl,
      registerData
    );
  }

  /**
   * Logout - Clears authentication data and user info
   */
  logout(): void {
    // Remove all auth data from localStorage
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authHeader');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
    
    // Update the observable to null (user is logged out)
    this.currentUserSubject.next(null);
  }

  /**
   * Gets the current user's ID from localStorage
   * 
   * @returns User ID as number, or null if not found
   */
  getUserId(): number | null {
    const id = localStorage.getItem('userId');
    return id ? parseInt(id, 10) : null;
  }

  /**
   * Gets the current user's email from localStorage
   * 
   * @returns User email as string, or null if not found
   */
  getUserEmail(): string | null {
    return localStorage.getItem('userEmail');
  }

  /**
   * Checks if user is currently authenticated
   * 
   * @returns true if authenticated, false otherwise
   */
  isAuthenticated(): boolean {
    return !!this.currentUserValue || localStorage.getItem('isAuthenticated') === 'true';
  }
}