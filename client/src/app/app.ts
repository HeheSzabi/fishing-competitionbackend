import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    CommonModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('client');
  
  constructor(private authService: AuthService) {}
  
  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }
  
  logout(): void {
    this.authService.logout();
  }
  
  isAdmin(): boolean {
    const user = this.authService.getCurrentUser();
    return user?.role === 'admin';
  }
}
