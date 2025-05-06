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
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-login-page',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatSnackBarModule
  ]
})
export class LoginPageComponent implements OnInit {
  loginForm!: FormGroup;
  registerForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  hidePassword = true;
  isLoginMode = true;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    // Check if already authenticated
    if (this.authService.isAuthenticated()) { 
      this.router.navigate(['/']);
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

    // Pre-fill with test values in development
    if (!environment.production) {
      this.loginForm.patchValue({
        email: 'test@example.com',
        password: 'password123'
      });
    }
  }

  // Toggle between login and register forms
  toggleFormMode(): void {
    this.isLoginMode = !this.isLoginMode;
    this.errorMessage = '';
  }

  /** Submit login; call AuthService and navigate on success */
  onLoginSubmit(): void {
    if (this.loginForm.invalid) { 
      return; 
    }

    const { email, password } = this.loginForm.value;
    console.log(`Attempting to login with email: ${email}`);
    
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(email, password).subscribe({
      next: (response: any) => {
        console.log('Login successful, token received:', response.token);
        this.isLoading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (error: HttpErrorResponse) => {
        console.error('Login error details:', error);
        this.isLoading = false;
        
        // Improved error messaging
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