import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';
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

/**
 * ProfileComponent
 * - Displays and edits the logged-in user’s profile
 * - Allows changing name, email (read-only), and password
 * - Supports account deletion with confirmation dialog
 */
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,

    // Material modules for UI elements
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
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  // TemplateRef for the delete confirmation dialog
  @ViewChild('deleteAccountDialog') deleteAccountDialog!: TemplateRef<any>;

  user: User | null = null;
  userId: number | null = null;
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  editMode = false;
  changePasswordMode = false;
  hidePassword = true;

  isLoading = false;
  isProfileUpdating = false;
  isPasswordUpdating = false;

  errorMessage = '';
  successMessage = '';
  deleteConfirmation = '';

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private auth: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private location: Location
  ) { }

  /**
  * Angular lifecycle hook: initialize forms and load user data
  */
  ngOnInit(): void {
    // Build the profile form; email field is disabled (read-only)
    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      email: [{ value: '', disabled: true }]
    });

    // Build the password form with matching validation
    this.passwordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatch });

    // Fetch the user's current data from the server
    this.loadUserData();
  }

   /**
   * Custom validator: ensures newPassword and confirmPassword match
   */
  private passwordMatch(group: FormGroup) {
    const np = group.get('newPassword')?.value;
    const cp = group.get('confirmPassword')?.value;
    return np && cp && np !== cp ? { passwordMismatch: true } : null;
  }

  /**
   * Loads the authenticated user's profile from the API
   * - Gets email from AuthService
   * - Calls UserService.getUserByEmail
   * - Patches form values with the returned data
   */
  loadUserData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    const email = this.auth.getUserEmail();
    if (!email) {
      this.errorMessage = 'User email missing, please log in again.';
      this.isLoading = false;
      return;
    }

    this.userService.getUserByEmail(email).subscribe({
      next: (data: any) => {
        this.user = {
          userId: data.UserId ?? data.userId,
          name: data.Name ?? data.name,
          email: data.Email ?? data.email,
          pw: data.Pw ?? data.pw ?? '',
          createdAt: new Date(data.CreatedAt ?? data.createdAt)
        };
        this.userId = this.user.userId;
        this.profileForm.patchValue({
          name: this.user.name,
          email: this.user.email
        });
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage = err.status === 401
          ? 'Authentication error. Please retry.'
          : 'Failed to load profile.';
        this.isLoading = false;
      }
    });
  }

  /**
   * Submits the profile form to update the user's display name
   */
  updateProfile(): void {
    if (this.profileForm.invalid || !this.user) return;
    this.isProfileUpdating = true;
    const updated: User = { ...this.user, name: this.profileForm.value.name };
    this.userService.updateUser(updated).subscribe({
      next: () => {
        this.user = updated;
        this.editMode = false;
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
   * Submits the password form to change the user's password
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
   * Opens a confirmation dialog before deleting the account
   */
  openDeleteDialog(): void {
    this.deleteConfirmation = '';
    const ref = this.dialog.open(this.deleteAccountDialog, { width: '400px' });
    ref.afterClosed().subscribe(ans => {
      if (ans === 'DELETE' && this.userId) {
        this.deleteAccount();
      }
    });
  }

  /**
   * Calls UserService.deleteUser and logs out on success
   */
  private deleteAccount(): void {
    if (!this.userId) return;
    this.isLoading = true;
    this.userService.deleteUser(this.userId).subscribe({
      next: () => {
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

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  navigateBack(): void {
    this.location.back();
  }

  refreshUserData(): void {
    this.loadUserData();
  }
}