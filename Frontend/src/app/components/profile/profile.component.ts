/**
 * Profile Component - User account management
 * 
 * This component provides:
 * - User profile display
 * - Name and email editing
 * - Password changing
 * - Account deletion with confirmation
 * 
 * It handles all user account management functionality.
 */
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { HttpErrorResponse } from '@angular/common/http';

import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/User';
import { NavFooterComponent } from '../shared/nav-footer.component';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    // Material UI modules
    MatIconModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDividerModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    NavFooterComponent
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfilePageComponent implements OnInit {
  // Reference to delete confirmation dialog template
  @ViewChild('deleteAccountDialog') deleteAccountDialog!: TemplateRef<any>;

  // User data
  user: User | null = null;
  userId: number | null = null;
  
  // Forms
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  
  // UI state
  editMode = false;             // Profile editing mode toggle
  changePasswordMode = false;   // Password changing mode toggle
  hidePassword = true;          // Password visibility toggle
  isLoading = false;            // Main loading state
  isProfileUpdating = false;    // Profile form submit state
  isPasswordUpdating = false;   // Password form submit state
  errorMessage = '';            // Error display
  successMessage = '';          // Success feedback
  deleteConfirmation = '';      // Delete confirmation input

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private auth: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) { }

  /**
   * Lifecycle hook that runs on component initialization
   * Sets up forms and loads user data
   */
  ngOnInit(): void {
    // Initialize profile edit form
    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      email: [{ value: '', disabled: true }] // Email is read-only
    });

    // Initialize password change form with matching validation
    this.passwordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatch });

    // Load the user's profile data
    this.loadUserData();
  }

  /**
   * Custom validator for password matching
   * Checks if confirm password matches new password
   * 
   * @param group Form group to validate
   * @returns Validation error object or null if valid
   */
  private passwordMatch(group: FormGroup) {
    const np = group.get('newPassword')?.value;
    const cp = group.get('confirmPassword')?.value;
    return np && cp && np !== cp ? { passwordMismatch: true } : null;
  }

  /**
   * Loads the authenticated user's profile data
   */
  loadUserData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    // Get user email from auth service
    const email = this.auth.getUserEmail();
    if (!email) {
      this.errorMessage = 'User email missing, please log in again.';
      this.isLoading = false;
      return;
    }

    // Fetch user data by email
    this.userService.getUserByEmail(email).subscribe({
      next: (data: any) => {
        // Normalize response data by handling different case formats
        this.user = {
          userId: data.UserId ?? data.userId,
          name: data.Name ?? data.name,
          email: data.Email ?? data.email,
          pw: data.Pw ?? data.pw ?? '',
          createdAt: new Date(data.CreatedAt ?? data.createdAt)
        };
        
        this.userId = this.user.userId;
        
        // Populate the profile form with user data
        this.profileForm.patchValue({
          name: this.user.name,
          email: this.user.email
        });
        
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        // Show appropriate error based on status code
        this.errorMessage = err.status === 401
          ? 'Authentication error. Please retry.'
          : 'Failed to load profile.';
        this.isLoading = false;
      }
    });
  }

  /**
   * Updates the user's profile (name)
   */
  updateProfile(): void {
    if (this.profileForm.invalid || !this.user) return;
    
    this.isProfileUpdating = true;
    
    // Create updated user object with new name
    const updated: User = { ...this.user, name: this.profileForm.value.name };
    
    this.userService.updateUser(updated).subscribe({
      next: () => {
        // Update local user object
        this.user = updated;
        this.editMode = false;
        
        // Show success message temporarily
        this.successMessage = 'Profile updated';
        setTimeout(() => this.successMessage = '', 3000);
        
        this.isProfileUpdating = false;
      },
      error: () => {
        this.errorMessage = 'Error updating profile';
        this.isProfileUpdating = false;
      }
    });
  }

  /**
   * Updates the user's password
   */
  updatePassword(): void {
    if (this.passwordForm.invalid || !this.user || this.user.userId == null) return;
    
    this.isPasswordUpdating = true;
    const newPwd = this.passwordForm.value.newPassword;

    this.userService.updatePassword(this.user.userId, newPwd).subscribe({
      next: () => {
        this.isPasswordUpdating = false;
        this.changePasswordMode = false;
        this.passwordForm.reset();
        
        // Show success message temporarily
        this.successMessage = 'Password updated successfully';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.isPasswordUpdating = false;
        this.errorMessage = err.message || 'Failed to update password';
        console.error('Password update error:', err);
      }
    });
  }

  /**
   * Opens the account deletion confirmation dialog
   */
  openDeleteDialog(): void {
    // Reset confirmation text
    this.deleteConfirmation = '';
    
    // Open the dialog and handle result
    const ref = this.dialog.open(this.deleteAccountDialog, { width: '400px' });
    ref.afterClosed().subscribe(ans => {
      if (ans === 'DELETE' && this.userId) {
        this.deleteAccount();
      }
    });
  }

  /**
   * Deletes the user's account
   */
  private deleteAccount(): void {
    if (!this.userId) return;
    
    this.isLoading = true;
    this.userService.deleteUser(this.userId).subscribe({
      next: () => {
        // Log out and redirect to login page
        this.auth.logout();
        this.router.navigate(['/login']);
        this.snackBar.open('Account deleted', 'Close', { duration: 3000 });
      },
      error: () => {
        this.errorMessage = 'Delete failed';
        this.isLoading = false;
      }
    });
  }

  /**
   * Logs out the current user
   */
  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  /**
   * Retries loading user data
   */
  refreshUserData(): void {
    this.loadUserData();
  }
}