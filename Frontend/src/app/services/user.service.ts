/**
 * User Service - Manages user profile operations
 * 
 * This service handles:
 * - Fetching user profile data
 * - Updating user information
 * - Changing passwords
 * - Deleting user accounts
 * 
 * It communicates with the backend API's /user endpoints.
 */
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { User } from '../models/User';
import { environment } from '../environments/environment';

// Interface for password update requests
interface PasswordUpdateRequest {
  UserId: number;    // Uses Pascal case to match API expectations
  Password: string;
}

@Injectable({
  providedIn: 'root'  // Singleton service available app-wide
})
export class UserService {
  // Base URL for user endpoints
  private baseUrl = `${environment.apiUrl}/user`;

  constructor(private http: HttpClient) { }

  /**
   * Gets user profile by email
   * 
   * @param email User's email address
   * @returns Observable of User
   */
  getUserByEmail(email: string): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/byemail/${email}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Updates user profile information
   * 
   * @param user User object with updated data
   * @returns Observable of the updated User
   */
  updateUser(user: User): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}`, user).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Updates user password
   * 
   * @param userId User's ID
   * @param password New password
   * @returns Observable of the HTTP response
   */
  updatePassword(userId: number, password: string): Observable<any> {
    // Format request to match API expectations
    const request: PasswordUpdateRequest = {
      UserId: userId,
      Password: password
    };

    return this.http.put(`${this.baseUrl}/password`, request).pipe(
      tap(() => {}),
      catchError(error => {
        // Provide user-friendly error messages based on status code
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
   * Deletes a user account
   * 
   * @param id User's ID to delete
   * @returns Observable of the HTTP response
   */
  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`).pipe(
      tap(() => {}),
      catchError(error => {
        // Provide user-friendly error messages based on status code
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
   * Generic error handler
   * 
   * @param error HTTP error from the API
   * @returns Observable error with user-friendly message
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error with status code
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;

      // Add context based on status codes
      if (error.status === 404) {
        errorMessage = 'The requested resource was not found';
      } else if (error.status === 403) {
        errorMessage = 'You do not have permission to perform this action';
      } else if (error.status === 400) {
        errorMessage = 'Invalid request';
      }
    }

    return throwError(() => new Error(errorMessage));
  }
}