import { Component } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthModalComponent } from '../auth/auth-modal.component';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatCardModule, MatDialogModule, MatSnackBarModule, CommonModule, RouterLink],
  templateUrl: './homepage.html',
  styleUrls: ['./homepage.scss']
})
export class HomepageComponent {
  
  constructor(
    private dialog: MatDialog,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  openAuthModal() {
    const dialogRef = this.dialog.open(AuthModalComponent, {
      width: '500px',
      maxWidth: '90vw',
      disableClose: false,
      autoFocus: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Authentication successful:', result);
        const user = this.authService.getCurrentUser();
        
        // Admin users always go to competitions
        if (user?.role === 'admin') {
          this.router.navigate(['/competitions']);
        } 
        // Only redirect to profile completion after REGISTRATION, not login
        else if (result.isRegistration && !user?.profileCompleted) {
          this.router.navigate(['/profile/complete']);
        } 
        // Otherwise go to competitions
        else {
          this.router.navigate(['/competitions']);
        }
      }
    });
  }

  navigateToNewCompetition() {
    if (this.authService.isAuthenticated()) {
      const user = this.authService.getCurrentUser();
      if (user?.role === 'admin') {
        this.router.navigate(['/competitions/new']);
      } else {
        this.snackBar.open('Only administrators can create competitions', 'Close', { duration: 3000 });
      }
    } else {
      this.openAuthModal();
    }
  }

  navigateToCompetitions() {
    this.router.navigate(['/competitions']);
  }

  logout() {
    this.authService.logout();
  }

  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  getCurrentUser() {
    return this.authService.getCurrentUser();
  }

  isAdmin(): boolean {
    const user = this.authService.getCurrentUser();
    return user?.role === 'admin';
  }
}