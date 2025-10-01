import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { CompetitionService } from '../../services/competition.service';
import { AuthService } from '../../services/auth.service';
import { RegistrationService } from '../../services/registration.service';
import { ParticipantService } from '../../services/participant.service';
import { WeighInService } from '../../services/weigh-in.service';
import { CompetitionDetails, CompetitionSummary, WeighIn } from '../../models/competition.model';

@Component({
  selector: 'app-competition-detail',
  standalone: true,
  imports: [
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    CommonModule
  ],
  templateUrl: './competition-detail.component.html',
  styleUrls: ['./competition-detail.component.scss']
})
export class CompetitionDetailComponent implements OnInit {
  competitionId: string = '';
  competitionDetails: CompetitionDetails | null = null;
  summary: CompetitionSummary | null = null;
  weighIns: WeighIn[] = [];
  loading = false;
  isRegistered = false;
  showAssignmentPreview = false;
  assignmentPreview: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private competitionService: CompetitionService,
    private authService: AuthService,
    private registrationService: RegistrationService,
    private participantService: ParticipantService,
    private weighInService: WeighInService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.competitionId = this.route.snapshot.paramMap.get('id') || '';
    this.loadCompetitionDetails();
    this.loadSummary();
    this.loadWeighIns();
    
    if (this.isAuthenticated()) {
      this.checkRegistrationStatus();
    }
  }

  checkRegistrationStatus(): void {
    this.registrationService.checkRegistration(this.competitionId).subscribe({
      next: (response) => {
        this.isRegistered = response.isRegistered;
      },
      error: (error) => {
        console.error('Error checking registration status:', error);
      }
    });
  }

  registerForCompetition(): void {
    if (!this.isAuthenticated()) {
      this.snackBar.open('Kérlek jelentkezz be a regisztrációhoz', 'Close', { duration: 3000 });
      return;
    }

    this.registrationService.registerForCompetition(this.competitionId).subscribe({
      next: (response) => {
        this.snackBar.open(response.message || 'Sikeresen regisztráltál!', 'Close', { duration: 4000 });
        this.isRegistered = true;
      },
      error: (error) => {
        console.error('Registration error:', error);
        this.snackBar.open(error.error?.message || 'Hiba történt a regisztráció során', 'Close', { duration: 3000 });
      }
    });
  }

  withdrawFromCompetition(): void {
    if (confirm(`Biztosan vissza szeretnél lépni erről a versenyről?`)) {
      this.registrationService.withdrawFromCompetition(this.competitionId).subscribe({
        next: (response) => {
          this.snackBar.open(response.message || 'Sikeresen visszaléptél!', 'Close', { duration: 4000 });
          this.isRegistered = false;
        },
        error: (error) => {
          console.error('Withdrawal error:', error);
          this.snackBar.open(error.error?.message || 'Hiba történt', 'Close', { duration: 3000 });
        }
      });
    }
  }

  loadCompetitionDetails(): void {
    this.loading = true;
    this.competitionService.getCompetition(this.competitionId).subscribe({
      next: (details) => {
        this.competitionDetails = details;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading competition details:', error);
        this.snackBar.open('Error loading competition details', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  loadSummary(): void {
    this.competitionService.getCompetitionSummary(this.competitionId).subscribe({
      next: (summary) => {
        this.summary = summary;
      },
      error: (error) => {
        console.error('Error loading competition summary:', error);
      }
    });
  }

  loadWeighIns(): void {
    this.weighInService.getWeighInsByCompetition(this.competitionId).subscribe({
      next: (weighIns) => {
        this.weighIns = weighIns;
      },
      error: (error) => {
        console.error('Error loading weigh-ins:', error);
      }
    });
  }

  navigateToParticipants(): void {
    this.router.navigate(['/competitions', this.competitionId, 'participants']);
  }

  navigateToWeighIn(): void {
    this.router.navigate(['/competitions', this.competitionId, 'weigh-in']);
  }

  navigateToResults(): void {
    this.router.navigate(['/competitions', this.competitionId, 'results']);
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  }

  getSectorParticipants(sectorName: string): any[] {
    if (!this.competitionDetails) return [];
    return this.competitionDetails.participants.filter(p => p.sector_name === sectorName);
  }

  getParticipantDisplayName(participant: any): string {
    if (participant.first_name && participant.last_name) {
      return `${participant.first_name} ${participant.last_name}`;
    }
    return participant.name;
  }

  getWeighInsCountForParticipant(participantId: string): number {
    return this.weighIns.filter(w => w.participant_id === participantId).length;
  }

  addNewMeasurement(participant: any): void {
    // Navigate to weigh-in page with the specific participant pre-selected
    this.router.navigate(['/competitions', this.competitionId, 'weigh-in'], {
      queryParams: { participantId: participant.id, refresh: Date.now() }
    });
  }

  randomAssignParticipants(): void {
    // Check if participants count is divisible by sectors count
    if (!this.isParticipantsDivisibleBySectors()) {
      this.snackBar.open('A résztvevők száma nem osztható a szektorok számával!', 'Bezár', { duration: 3000 });
      return;
    }

    // Check if sectors are already assigned
    if (this.areSectorsAlreadyAssigned()) {
      this.snackBar.open('A szektorok már hozzá vannak rendelve! A hozzárendelés csak egyszer tehető meg.', 'Bezár', { duration: 4000 });
      return;
    }

    if (this.showAssignmentPreview) {
      // Execute the actual assignment
      if (confirm('Biztosan véletlenszerűen szeretné szektorokhoz rendelni az összes résztvevőt? Ez a művelet nem vonható vissza!')) {
        this.executeRandomAssignment();
      }
    } else {
      // Show preview first
      this.generateAssignmentPreview();
    }
  }

  isParticipantsDivisibleBySectors(): boolean {
    if (!this.summary || !this.competitionDetails) return false;
    const participantCount = this.summary.participant_count || 0;
    const sectorCount = this.summary.sector_count || 0;
    return participantCount > 0 && sectorCount > 0 && participantCount % sectorCount === 0;
  }

  areSectorsAlreadyAssigned(): boolean {
    if (!this.competitionDetails) return false;
    // Check if any participant already has a sector assigned
    return this.competitionDetails.participants.some(p => p.sector_id && p.sector_name);
  }

  generateAssignmentPreview(): void {
    if (!this.competitionDetails) return;

    const participants = [...this.competitionDetails.participants];
    const sectors = [...this.competitionDetails.sectors].sort((a, b) => a.name.localeCompare(b.name));
    
    // Shuffle participants
    const shuffledParticipants = participants.sort(() => Math.random() - 0.5);
    
    // Generate preview assignments
    this.assignmentPreview = shuffledParticipants.map((participant, index) => {
      const sectorIndex = index % sectors.length;
      return {
        participant: participant,
        sector: sectors[sectorIndex].name,
        sectorIndex: sectorIndex
      };
    });

    this.showAssignmentPreview = true;
  }

  executeRandomAssignment(): void {
    this.participantService.randomAssignParticipants(this.competitionId).subscribe({
      next: (response) => {
        this.snackBar.open(response.message || 'Résztvevők sikeresen szektorokhoz rendelve!', 'Bezár', { duration: 4000 });
        this.loadCompetitionDetails(); // Reload to show updated sector assignments
        this.showAssignmentPreview = false;
        this.assignmentPreview = [];
      },
      error: (error) => {
        console.error('Error in random assignment:', error);
        this.snackBar.open(error.error?.message || 'Hiba történt a szektor hozzárendelésekor', 'Bezár', { duration: 3000 });
      }
    });
  }

  cancelAssignmentPreview(): void {
    this.showAssignmentPreview = false;
    this.assignmentPreview = [];
  }

  isAdmin(): boolean {
    const user = this.authService.getCurrentUser();
    return user?.role === 'admin';
  }

  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  getCoverImageUrl(coverImagePath: string | undefined): string {
    if (!coverImagePath) {
      return '';
    }
    // If the path already includes the full URL, return as is
    if (coverImagePath.startsWith('http')) {
      return coverImagePath;
    }
    // Otherwise, construct the full URL
    return `http://localhost:3001${coverImagePath}`;
  }

  formatSchedule(schedule: string | undefined): string {
    if (!schedule) return '';
    
    // Add line breaks after specific time patterns and major sections
    return schedule
      .replace(/(\d{1,2}:\d{2}[^0-9]*?)(?=\d{1,2}:\d{2})/g, '$1\n')
      .replace(/([.!?])(?=\s*[A-ZÁÉÍÓÖŐÚÜŰ])/g, '$1\n')
      .replace(/(\d{1,2}:\d{2}[^0-9]*?)(?=\s*\d{1,2}:\d{2})/g, '$1\n\n');
  }

  formatRules(rules: string | undefined): string {
    if (!rules) return '';
    
    // Add line breaks after numbered points and major sections
    return rules
      .replace(/(\d+\.\s*[^0-9]+?)(?=\s*\d+\.)/g, '$1\n\n')
      .replace(/([.!?])(?=\s*[A-ZÁÉÍÓÖŐÚÜŰ])/g, '$1\n')
      .replace(/(\d+\.\s*[^0-9]+?)(?=\s*\d+\.)/g, '$1\n');
  }

  formatGeneralRules(rules: string | undefined): string {
    if (!rules) return '';
    
    // Add line breaks after numbered points and major sections
    return rules
      .replace(/(\d+\.\s*[^0-9]+?)(?=\s*\d+\.)/g, '$1\n\n')
      .replace(/([.!?])(?=\s*[A-ZÁÉÍÓÖŐÚÜŰ])/g, '$1\n')
      .replace(/(\d+\.\s*[^0-9]+?)(?=\s*\d+\.)/g, '$1\n');
  }
}
