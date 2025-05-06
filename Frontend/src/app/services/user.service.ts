import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { User } from '../models/User';
import { environment } from '../environments/environment';

//Request payload for updating a user's password
interface PasswordUpdateRequest {
  UserId: number;
  Password: string;
}

/**
 * UserService manages user profile CRUD operations and password changes.
 * Communicates with backend endpoints under /user.
 */
@Injectable({
  providedIn: 'root'
})
export class UserService {
  private baseUrl = `${environment.apiUrl}/user`;

  constructor(private http: HttpClient) { }

  //Get user by email
  getUserByEmail(email: string): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/byemail/${email}`).pipe(
      catchError(this.handleError)
    );
  }

  //Update user profile
  updateUser(user: User): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}`, user).pipe(
      catchError(this.handleError)
    );
  }

  //Update user password
  updatePassword(userId: number, password: string): Observable<any> {
    const request: PasswordUpdateRequest = {
      UserId: userId,
      Password: password
    };

    console.log(`Updating password for user ID: ${userId}`);

    return this.http.put(`${this.baseUrl}/password`, request).pipe(
      tap(response => console.log('Password update successful')),
      catchError(error => {
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

  // Delete a user account
  deleteUser(id: number): Observable<any> {
    console.log(`Deleting user with ID: ${id}`);

    return this.http.delete(`${this.baseUrl}/${id}`).pipe(
      tap(() => console.log('User deleted successfully')),
      catchError(error => {
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

  // Generic error handler that doesn't auto-logout
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