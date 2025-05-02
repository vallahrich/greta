// src/app/services/user.service.ts
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { User } from '../models/user';
import { environment } from '../environments/environment';

interface PasswordUpdateRequest {
  UserId: number;
  Password: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private baseUrl = `${environment.apiUrl}/user`;

  constructor(private http: HttpClient) { }

  /**
   * Get user by ID
   */
  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get user by email
   */
  getUserByEmail(email: string): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/byemail/${email}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Update user profile
   */
  updateUser(user: User): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}`, user).pipe(
      catchError(this.handleError)
    );
  }

  // src/app/services/user.service.ts
  // Update deleteUser and updatePassword methods

  /**
   * Update user password
   */
  updatePassword(userId: number, password: string): Observable<any> {
    const request: PasswordUpdateRequest = {
      UserId: userId,
      Password: password
    };

    console.log(`Updating password for user ID: ${userId}`);

    return this.http.put(`${this.baseUrl}/password`, request).pipe(
      tap(response => console.log('Password update successful')),
      catchError(error => {
        // The auth interceptor will handle 401 errors automatically
        // We only need to handle other types of errors
        console.error('Error updating password:', error);

        if (error.status === 403) {
          return throwError(() => new Error('You do not have permission to update this password.'));
        } else if (error.status === 404) {
          return throwError(() => new Error('User not found.'));
        } else if (error.status === 400) {
          return throwError(() => new Error(error.error || 'Invalid password data.'));
        }

        return throwError(() => new Error('Failed to update password. Please try again.'));
      })
    );
  }

  /**
   * Delete a user account
   */
  deleteUser(id: number): Observable<any> {
    console.log(`Deleting user with ID: ${id}`);

    return this.http.delete(`${this.baseUrl}/${id}`).pipe(
      tap(() => console.log('User deleted successfully')),
      catchError(error => {
        // The auth interceptor will handle 401 errors automatically
        console.error('Error deleting user:', error);

        if (error.status === 403) {
          return throwError(() => new Error('You do not have permission to delete this account.'));
        } else if (error.status === 404) {
          return throwError(() => new Error('User not found.'));
        }

        return throwError(() => new Error('Failed to delete account. Please try again.'));
      })
    );
  }

  /**
   * Create a new user (usually handled through auth.service register)
   */
  createUser(user: User): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}`, user).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get all users (admin function)
   */
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.baseUrl).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Check if an email exists (used during registration)
   */
  checkEmailExists(email: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.baseUrl}/exists/email/${email}`).pipe(
      catchError(this.handleError)
    );
  }


  /**
   * Generic error handler that doesn't auto-logout
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;

      // Add more context based on specific status codes
      if (error.status === 404) {
        errorMessage = 'The requested resource was not found';
      } else if (error.status === 403) {
        errorMessage = 'You do not have permission to perform this action';
      } else if (error.status === 400) {
        errorMessage = 'Invalid request';
      }
    }

    console.error(errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}