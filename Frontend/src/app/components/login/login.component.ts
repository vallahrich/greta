import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthService } from '../../services/auth.service';

/**
 * LoginComponent handles user authentication (login & registration)
 * - Toggles between login and register modes
 * - Validates forms and calls AuthService
 * - Provides user feedback via spinner and error messages
 */
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,   // For reactive form controls
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatSnackBarModule
  ]
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;       // Form for login fields
  registerForm!: FormGroup;    // Form for registration fields
  isLoading = false;           // Spinner flag
  errorMessage = '';           // Display errors to user
  hidePassword = true;         // Toggle password visibility
  isLoginMode = true;          // Switch between login/register UI

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    // Redirect to dashboard if already logged in
    if (this.authService.isAuthenticated) {
      this.router.navigate(['/dashboard']);
      return;
    }

    // Initialize login form
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    // Initialize register form
    this.registerForm = this.formBuilder.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  // Toggle between login and register forms
  toggleFormMode(): void {
    this.isLoginMode = !this.isLoginMode;
    this.errorMessage = '';
  }

  /** Submit login; call AuthService and navigate on success */
  onLoginSubmit(): void {
    if (this.loginForm.invalid) { // Abort if form invalid
      return; 
    }

    const { email, password } = this.loginForm.value;
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(email, password).subscribe({
      next: (response: any) => {
         // Backend puts token in header; frontend just navigates
        console.log('Login successful, token received:', response.headerValue);
        this.isLoading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        this.errorMessage = 'Invalid email or password. Please try again.';
        console.error('Login error:', error);
      }
    });
  }

  /** Submit registration; call AuthService and switch to login on success */
  onRegisterSubmit(): void {
    if (this.registerForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Create register request object
    const registerData = {
      name: this.registerForm.value.name,
      email: this.registerForm.value.email,
      password: this.registerForm.value.password
    };

    // Use AuthService to register
    this.authService.register(registerData).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.snackBar.open('Registration successful! Please login.', 'Close', {
          duration: 3000
        });
        this.isLoginMode = true; // Switch to login form

        // Pre-fill the login form with the email
        this.loginForm.patchValue({
          email: registerData.email
        });
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
// Handle conflict (409) vs general errors
        if (error.status === 409) {
          this.errorMessage = 'Email already exists. Please use a different email.';
        } else {
          this.errorMessage = 'Registration failed. Please try again.';
        }
        console.error('Registration error:', error);
      }
    });
  }

  // Convenience getters for form fields
  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }
}