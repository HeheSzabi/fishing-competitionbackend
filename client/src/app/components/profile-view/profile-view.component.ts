import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { AuthService, User } from '../../services/auth.service';
import { RegistrationService, CompetitionRegistration } from '../../services/registration.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-profile-view',
  standalone: true,
  imports: [
    RouterLink,
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatChipsModule
  ],
  templateUrl: './profile-view.component.html',
  styleUrls: ['./profile-view.component.scss']
})
export class ProfileViewComponent implements OnInit {
  profile: any = null;
  isLoading = true;
  currentUser: User | null = null;
  registrations: CompetitionRegistration[] = [];
  loadingRegistrations = true;

  constructor(
    private authService: AuthService,
    private registrationService: RegistrationService,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadProfile();
    this.loadRegistrations();
  }

  loadProfile(): void {
    const token = this.authService.getToken();
    const headers = { 'Authorization': `Bearer ${token}` };

    this.http.get('http://localhost:3001/api/auth/profile', { headers }).subscribe({
      next: (profile: any) => {
        this.profile = profile;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        this.isLoading = false;
      }
    });
  }

  getPhotoUrl(): string {
    if (this.profile?.photoUrl) {
      return `http://localhost:3001${this.profile.photoUrl}`;
    }
    return 'assets/default-avatar.png'; // Fallback image
  }

  editProfile(): void {
    this.router.navigate(['/profile/complete']);
  }

  goToCompetitions(): void {
    this.router.navigate(['/competitions']);
  }

  getProfileCompleteness(): number {
    if (!this.profile) return 0;
    
    let completed = 0;
    let total = 7;

    if (this.profile.firstName) completed++;
    if (this.profile.lastName) completed++;
    if (this.profile.email) completed++;
    if (this.profile.phone) completed++;
    if (this.profile.streetAddress) completed++;
    if (this.profile.city) completed++;
    if (this.profile.photoUrl) completed++;

    return Math.round((completed / total) * 100);
  }

  isProfileComplete(): boolean {
    return this.getProfileCompleteness() === 100;
  }

  loadRegistrations(): void {
    if (!this.currentUser?.id) return;
    
    this.registrationService.getUserRegistrations(this.currentUser.id).subscribe({
      next: (registrations) => {
        this.registrations = registrations.filter(r => r.status === 'registered');
        this.loadingRegistrations = false;
      },
      error: (error) => {
        console.error('Error loading registrations:', error);
        this.loadingRegistrations = false;
      }
    });
  }

  viewCompetition(competitionId: string): void {
    this.router.navigate(['/competitions', competitionId]);
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getRegisteredCompetitionsCount(): number {
    return this.registrations.length;
  }
}

