import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { HttpErrorResponse } from '@angular/common/http';

import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule,
    FormsModule, 
    ReactiveFormsModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatMenuModule,
    MatCardModule,
    MatDividerModule,
    MatDialogModule
  ]
})
export class ProfileComponent implements OnInit {
  @ViewChild('deleteAccountDialog') deleteAccountDialog!: TemplateRef<any>;
  
  // User data
  user: User | null = null;
  userId: number | null = null;
  
  // Form states
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  editMode: boolean = false;
  changePasswordMode: boolean = false;
  hidePassword: boolean = true;
  
  // Loading states
  isLoading: boolean = false;
  isProfileUpdating: boolean = false;
  isPasswordUpdating: boolean = false;
  
  // Message states
  errorMessage: string = '';
  successMessage: string = '';
  
  // Delete account confirmation
  deleteConfirmation: string = '';
  
  // Max retry count
  private maxRetries = 3;
  private retryCount = 0;
  
  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}
  
  ngOnInit(): void {
    this.initForms();
    this.loadUserData();
  }
  
  /**
   * Initialize all forms
   */
  private initForms(): void {
    // Profile edit form
    this.profileForm = this.formBuilder.group({
      name: ['', [Validators.required]],
      email: [{ value: '', disabled: true }] // Email field is read-only
    });
    
    // Password change form
    this.passwordForm = this.formBuilder.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }
  
  /**
   * Custom validator to ensure passwords match
   */
  private passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      return { 'passwordMismatch': true };
    }
    
    return null;
  }
  
  /**
   * Load user data using email from localStorage with retry capability
   */
  loadUserData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    
    // Get email from localStorage
    const email = this.authService.getUserEmail();
    
    if (!email) {
      this.errorMessage = 'User email not found. Please log in again.';
      this.isLoading = false;
      return;
    }
    
    // Log the auth headers for debugging
    console.log('Auth headers:', this.authService.getAuthHeaders());
    
    this.userService.getUserByEmail(email).subscribe({
      next: (data) => {
        console.log('User data loaded:', data);
        this.user = data;
        this.userId = data.user_id;
        this.populateForm(data);
        this.isLoading = false;
        this.retryCount = 0; // Reset retry count on success
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error loading user data:', error);
        
        if (error.status === 401 && this.retryCount < this.maxRetries) {
          // Retry logic for 401 errors
          this.retryCount++;
          this.errorMessage = `Authentication error. Retrying (${this.retryCount}/${this.maxRetries})...`;
          
          // Wait a moment before retrying
          setTimeout(() => {
            this.loadUserData();
          }, 1000);
        } else {
          if (error.status === 401) {
            this.errorMessage = 'Authentication error. Please try refreshing the page or log in again.';
          } else {
            this.errorMessage = 'Failed to load your profile. Please try again.';
          }
          
          this.isLoading = false;
        }
      }
    });
  }
  
  /**
   * Populate the form with user data
   */
  private populateForm(user: User): void {
    this.profileForm.patchValue({
      name: user.name,
      email: user.email
    });
  }
  
  /**
   * Update profile information
   */
  updateProfile(): void {
    if (this.profileForm.invalid || !this.user) {
      return;
    }
    
    this.isProfileUpdating = true;
    this.errorMessage = '';
    this.successMessage = '';
    
    const updatedUser: User = {
      ...this.user,
      name: this.profileForm.value.name
    };
    
    this.userService.updateUser(updatedUser).subscribe({
      next: (response) => {
        this.isProfileUpdating = false;
        this.editMode = false;
        this.user = updatedUser;
        this.successMessage = 'Profile updated successfully';
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error) => {
        console.error('Error updating profile:', error);
        this.errorMessage = 'Failed to update profile. Please try again.';
        this.isProfileUpdating = false;
      }
    });
  }
  
  /**
   * Update password
   */
  updatePassword(): void {
    if (this.passwordForm.invalid || !this.userId) {
      return;
    }
    
    this.isPasswordUpdating = true;
    this.errorMessage = '';
    this.successMessage = '';
    
    const newPassword = this.passwordForm.value.newPassword;
    
    this.userService.updatePassword(this.userId, newPassword).subscribe({
      next: (response) => {
        this.isPasswordUpdating = false;
        this.changePasswordMode = false;
        this.passwordForm.reset();
        
        this.successMessage = 'Password updated successfully';
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error) => {
        console.error('Error updating password:', error);
        this.errorMessage = 'Failed to update password. Please try again.';
        this.isPasswordUpdating = false;
      }
    });
  }
  
  /**
   * Open delete account confirmation dialog
   */
  openDeleteAccountDialog(): void {
    this.deleteConfirmation = '';
    
    const dialogRef = this.dialog.open(this.deleteAccountDialog, {
      width: '400px'
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result && this.userId) {
        this.deleteAccount();
      }
    });
  }
  
  /**
   * Delete user account
   */
  deleteAccount(): void {
    if (!this.userId) {
      this.errorMessage = 'User ID not found';
      return;
    }
    
    this.isLoading = true;
    this.errorMessage = '';
    
    this.userService.deleteUser(this.userId).subscribe({
      next: () => {
        this.isLoading = false;
        this.authService.logout();
        this.router.navigate(['/login']);
        this.snackBar.open('Your account has been deleted', 'Close', {
          duration: 5000
        });
      },
      error: (error) => {
        console.error('Error deleting account:', error);
        this.errorMessage = 'Failed to delete account. Please try again.';
        this.isLoading = false;
      }
    });
  }
  
  /**
   * Navigate back to previous page
   */
  navigateBack(): void {
    window.history.back();
  }
  
  /**
   * Logout user
   */
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
  
  /**
   * Force refresh user data
   */
  refreshUserData(): void {
    this.retryCount = 0;
    this.loadUserData();
  }
}