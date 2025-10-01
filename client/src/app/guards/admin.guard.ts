import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    if (this.authService.isAuthenticated()) {
      const user = this.authService.getCurrentUser();
      if (user?.role === 'admin') {
        return true;
      } else {
        // Redirect to competitions list with error message
        this.router.navigate(['/competitions']);
        return false;
      }
    } else {
      this.router.navigate(['/']);
      return false;
    }
  }
}
