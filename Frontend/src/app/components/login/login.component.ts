/**
 * Login Component - Handles user authentication UI
 * 
 * This component provides:
 * - Login form with validation
 * - Registration form with validation
 * - Toggle between login and registration modes
 * - Error handling and feedback
 * 
 * It's the entry point for users to access the application.
 */
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login-page',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: true,  // Angular 17+ standalone component
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    // Material UI modules
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatSnackBarModule,
  ]
})
export class LoginPageComponent implements OnInit {
  loginForm!: FormGroup;      // Form for login mode
  registerForm!: FormGroup;   // Form for registration mode
  isLoading = false;          // Controls spinner visibility
  errorMessage = '';          // Displays error messages to user
  hidePassword = true;        // Toggle for password visibility
  isLoginMode = true;         // Toggle between login/register modes

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    // If already authenticated, redirect to home
    if (this.authService.isAuthenticated()) { 
      this.router.navigate(['/']);
    }

    // Initialize login form with validators
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    // Initialize register form with validators
    this.registerForm = this.formBuilder.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  /**
   * Toggles between login and register forms
   */
  toggleFormMode(): void {
    this.isLoginMode = !this.isLoginMode;
    this.errorMessage = ''; // Clear any previous errors
  }

  /**
   * Handles login form submission
   */
  onLoginSubmit(): void {
    // Skip if form is invalid
    if (this.loginForm.invalid) { 
      return; 
    }

    const { email, password } = this.loginForm.value;
    
    this.isLoading = true;
    this.errorMessage = '';

    // Call auth service to perform login
    this.authService.login(email, password).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/dashboard']); // Redirect on success
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        
        // Show user-friendly error message based on status code
        if (error.status === 401) {
          this.errorMessage = 'Invalid credentials. Please check your email and password.';
        } else if (error.status === 0) {
          this.errorMessage = 'Cannot connect to server. Please check your internet connection.';
        } else {
          this.errorMessage = `Login failed: ${error.error || error.message || 'Unknown error'}`;
        }
      }
    });
  }

  /**
   * Handles register form submission
   */
  onRegisterSubmit(): void {
    if (this.registerForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Create registration data object from form
    const registerData = {
      name: this.registerForm.value.name,
      email: this.registerForm.value.email,
      password: this.registerForm.value.password
    };

    // Call auth service to perform registration
    this.authService.register(registerData).subscribe({
      next: () => {
        this.isLoading = false;
        // Show success message
        this.snackBar.open('Registration successful! Please login.', 'Close', {
          duration: 3000
        });
        this.isLoginMode = true; // Switch to login form

        // Pre-fill the login form with the registered email
        this.loginForm.patchValue({
          email: registerData.email
        });
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        // Handle specific error cases
        if (error.status === 409) {
          this.errorMessage = 'Email already exists. Please use a different email.';
        } else {
          this.errorMessage = 'Registration failed. Please try again.';
        }
      }
    });
  }
}