import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatTabsModule,
    MatIconModule,
    ReactiveFormsModule
  ],
  templateUrl: './auth-modal.component.html',
  styleUrls: ['./auth-modal.component.scss']
})
export class AuthModalComponent {
  @Output() authSuccess = new EventEmitter<any>();
  
  loginForm: FormGroup;
  registerForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private dialogRef: MatDialogRef<AuthModalComponent>
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern(/^[0-9+\-\s()]*$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    return password && confirmPassword && password.value === confirmPassword.value 
      ? null : { mismatch: true };
  }

  onLogin() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      
      this.authService.login(this.loginForm.value).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.authSuccess.emit(response);
          this.dialogRef.close({ ...response, isRegistration: false });
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Login failed';
        }
      });
    }
  }

  onRegister() {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      
      const { confirmPassword, ...userData } = this.registerForm.value;
      
      this.authService.register(userData).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.authSuccess.emit(response);
          this.dialogRef.close({ ...response, isRegistration: true });
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Registration failed';
        }
      });
    }
  }

  close() {
    this.dialogRef.close();
  }
}
