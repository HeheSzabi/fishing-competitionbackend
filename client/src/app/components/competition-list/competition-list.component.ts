import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { CommonModule } from '@angular/common';
import { CompetitionService } from '../../services/competition.service';
import { AuthService } from '../../services/auth.service';
import { RegistrationService } from '../../services/registration.service';
import { Competition } from '../../models/competition.model';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-competition-list',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatToolbarModule,
    RouterLink,
    RouterLinkActive,
    CommonModule
  ],
  templateUrl: './competition-list.component.html',
  styleUrls: ['./competition-list.component.scss']
})
export class CompetitionListComponent implements OnInit {
  competitions: Competition[] = [];
  loading = false;
  registrationStatus: Map<string, boolean> = new Map();

  constructor(
    private competitionService: CompetitionService,
    private authService: AuthService,
    private registrationService: RegistrationService,
    private router: Router,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loadCompetitions();
  }

  loadCompetitions(): void {
    this.loading = true;
    this.competitionService.getCompetitions().subscribe({
      next: (competitions) => {
        this.competitions = competitions;
        this.loading = false;
        
        // Check registration status for each competition if user is authenticated
        if (this.isAuthenticated()) {
          this.checkRegistrationStatuses();
        }
      },
      error: (error) => {
        console.error('Error loading competitions:', error);
        this.snackBar.open('Error loading competitions', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  checkRegistrationStatuses(): void {
    const checkRequests = this.competitions.map(comp =>
      this.registrationService.checkRegistration(comp.id)
    );

    forkJoin(checkRequests).subscribe({
      next: (results) => {
        results.forEach((result, index) => {
          this.registrationStatus.set(this.competitions[index].id, result.isRegistered);
        });
      },
      error: (error) => {
        console.error('Error checking registration statuses:', error);
      }
    });
  }

  isRegisteredForCompetition(competitionId: string): boolean {
    return this.registrationStatus.get(competitionId) || false;
  }

  registerForCompetition(competition: Competition, event: Event): void {
    event.stopPropagation(); // Prevent card click
    
    if (!this.isAuthenticated()) {
      this.snackBar.open('Kérlek jelentkezz be a regisztrációhoz', 'Close', { duration: 3000 });
      return;
    }

    this.registrationService.registerForCompetition(competition.id).subscribe({
      next: (response) => {
        this.snackBar.open(response.message || 'Sikeresen regisztráltál!', 'Close', { duration: 4000 });
        this.registrationStatus.set(competition.id, true);
      },
      error: (error) => {
        console.error('Registration error:', error);
        this.snackBar.open(error.error?.message || 'Hiba történt a regisztráció során', 'Close', { duration: 3000 });
      }
    });
  }

  withdrawFromCompetition(competition: Competition, event: Event): void {
    event.stopPropagation(); // Prevent card click
    
    if (confirm(`Biztosan vissza szeretnél lépni a versenyről: "${competition.name}"?`)) {
      this.registrationService.withdrawFromCompetition(competition.id).subscribe({
        next: (response) => {
          this.snackBar.open(response.message || 'Sikeresen visszaléptél!', 'Close', { duration: 4000 });
          this.registrationStatus.set(competition.id, false);
        },
        error: (error) => {
          console.error('Withdrawal error:', error);
          this.snackBar.open(error.error?.message || 'Hiba történt', 'Close', { duration: 3000 });
        }
      });
    }
  }

  viewCompetition(competition: Competition): void {
    this.router.navigate(['/competitions', competition.id]);
  }

  editCompetition(competition: Competition): void {
    this.router.navigate(['/competitions', competition.id, 'edit']);
  }

  deleteCompetition(competition: Competition): void {
    if (confirm(`Are you sure you want to delete "${competition.name}"?`)) {
      this.competitionService.deleteCompetition(competition.id).subscribe({
        next: () => {
          this.snackBar.open('Competition deleted successfully', 'Close', { duration: 3000 });
          this.loadCompetitions();
        },
        error: (error) => {
          console.error('Error deleting competition:', error);
          this.snackBar.open('Error deleting competition', 'Close', { duration: 3000 });
        }
      });
    }
  }

  createNewCompetition(): void {
    this.router.navigate(['/competitions/new']);
  }

  isAdmin(): boolean {
    const user = this.authService.getCurrentUser();
    return user?.role === 'admin';
  }

  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  logout(): void {
    this.authService.logout();
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  getCoverImageUrl(coverImage: string): string {
    return `http://localhost:3001${coverImage}`;
  }
}
