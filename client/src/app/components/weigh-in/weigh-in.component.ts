import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSelect } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { WeighInService } from '../../services/weigh-in.service';
import { CompetitionService } from '../../services/competition.service';
import { AuthService } from '../../services/auth.service';
import { WeighIn, Participant, CompetitionDetails } from '../../models/competition.model';

@Component({
  selector: 'app-weigh-in',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
  templateUrl: './weigh-in.component.html',
  styleUrls: ['./weigh-in.component.scss']
})
export class WeighInComponent implements OnInit, OnDestroy {
  competitionId: string = '';
  competitionDetails: CompetitionDetails | null = null;
  weighIns: WeighIn[] = [];
  loading = false;
  showAddForm = false;
  private routeSubscription?: Subscription;

  addWeighInForm: FormGroup;
  selectedParticipant: Participant | null = null;
  
  @ViewChild('participantSelect') participantSelect?: MatSelect;
  @ViewChild('weightInput') weightInput?: ElementRef;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private weighInService: WeighInService,
    private competitionService: CompetitionService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder
  ) {
    this.addWeighInForm = this.fb.group({
      participant_id: ['', Validators.required],
      weight_grams: ['', [Validators.required, Validators.min(1)]],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.competitionId = this.route.snapshot.paramMap.get('id') || '';
    
    // Check if refresh parameter is provided to force reload
    const refresh = this.route.snapshot.queryParamMap.get('refresh');
    if (refresh) {
      // Force reload with a small delay to ensure fresh data
      setTimeout(() => {
        this.loadCompetitionDetails();
        this.loadWeighIns();
      }, 500);
    } else {
      this.loadCompetitionDetails();
      this.loadWeighIns();
    }
    
    // Check if participantId is provided in query params
    const participantId = this.route.snapshot.queryParamMap.get('participantId');
    if (participantId) {
      // Show the add form and pre-select the participant
      setTimeout(() => {
        this.showAddForm = true;
        this.addWeighInForm.patchValue({ participant_id: participantId });
        this.onParticipantSelected();
      }, 1500); // Wait for competition details to load
    }
  }

  refreshData(): void {
    this.loadCompetitionDetails();
    this.loadWeighIns();
  }

  forceRefresh(): void {
    // Clear existing data first
    this.competitionDetails = null;
    this.weighIns = [];
    
    // Add timestamp to force cache bust
    const timestamp = Date.now();
    
    // Reload with delay to ensure fresh data
    setTimeout(() => {
      this.loadCompetitionDetails();
      this.loadWeighIns();
    }, 100);
    
    this.snackBar.open('Adatok kényszerített frissítése...', 'Bezár', { duration: 2000 });
  }

  ngOnDestroy(): void {
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }

  loadCompetitionDetails(): void {
    this.loading = true;
    this.competitionService.getCompetition(this.competitionId).subscribe({
      next: (details) => {
        this.competitionDetails = details;
        console.log('Loaded competition details:', details);
        console.log('Participants with sectors:', details.participants?.map(p => ({ 
          name: p.name, 
          sector_name: p.sector_name, 
          sector_id: p.sector_id 
        })));
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading competition details:', error);
        this.snackBar.open('Hiba a verseny részleteinek betöltésekor', 'Bezár', { duration: 3000 });
        this.loading = false;
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
        this.snackBar.open('Hiba a mérések betöltésekor', 'Bezár', { duration: 3000 });
      }
    });
  }

  toggleAddForm(): void {
    this.showAddForm = !this.showAddForm;
    if (this.showAddForm) {
      this.addWeighInForm.reset();
      this.selectedParticipant = null;
      // Scroll to top to show the form
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        // Auto-focus on participant dropdown
        setTimeout(() => {
          this.participantSelect?.open();
        }, 300);
      }, 100);
    }
  }

  onParticipantSelected(): void {
    const participantId = this.addWeighInForm.get('participant_id')?.value;
    if (this.competitionDetails) {
      this.selectedParticipant = this.competitionDetails.participants.find(p => p.id === participantId) || null;
      // Auto-focus on weight input after participant selection
      setTimeout(() => {
        this.weightInput?.nativeElement.focus();
      }, 200);
    }
  }

  onSubmitWeighIn(): void {
    if (this.addWeighInForm.valid) {
      const formData = this.addWeighInForm.value;

      this.weighInService.addWeighIn(formData).subscribe({
        next: (weighIn) => {
          this.snackBar.open('Mérés sikeresen rögzítve!', 'Bezár', { duration: 3000 });
          this.loadWeighIns();
          this.showAddForm = false;
          this.addWeighInForm.reset();
          this.selectedParticipant = null;
        },
        error: (error) => {
          console.error('Error adding weigh-in:', error);
          this.snackBar.open('Hiba a mérés rögzítésekor', 'Bezár', { duration: 3000 });
        }
      });
    }
  }

  deleteWeighIn(weighIn: WeighIn): void {
    if (confirm('Biztosan törli ezt a mérést?')) {
      this.weighInService.deleteWeighIn(weighIn.id).subscribe({
        next: () => {
          this.snackBar.open('Mérés sikeresen törölve!', 'Bezár', { duration: 3000 });
          this.loadWeighIns();
        },
        error: (error) => {
          console.error('Error deleting weigh-in:', error);
          this.snackBar.open('Hiba a mérés törlésekor', 'Bezár', { duration: 3000 });
        }
      });
    }
  }

  getTotalWeightForParticipant(participantId: string): number {
    return this.weighIns
      .filter(w => w.participant_id === participantId)
      .reduce((total, w) => total + w.weight_grams, 0);
  }

  getWeighInsForParticipant(participantId: string): WeighIn[] {
    return this.weighIns
      .filter(w => w.participant_id === participantId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  getSectors(): string[] {
    if (!this.competitionDetails) return [];
    return [...new Set(this.competitionDetails.participants.map(p => p.sector_name).filter((s): s is string => !!s))].sort();
  }

  getParticipantsBySector(sectorName: string): Participant[] {
    if (!this.competitionDetails) return [];
    return this.competitionDetails.participants
      .filter(p => p.sector_name === sectorName)
      .sort((a, b) => this.getTotalWeightForParticipant(b.id) - this.getTotalWeightForParticipant(a.id));
  }

  getSectorRank(participant: Participant): number {
    if (!participant.sector_name) return 0;
    const sectorParticipants = this.getParticipantsBySector(participant.sector_name);
    return sectorParticipants.findIndex(p => p.id === participant.id) + 1;
  }

  getSectorPoints(participant: Participant): number {
    if (!participant.sector_name) return 0;
    const sectorParticipants = this.getParticipantsBySector(participant.sector_name);
    const rank = this.getSectorRank(participant);
    const maxPoints = sectorParticipants.length;
    return maxPoints - rank + 1;
  }

  getTotalPoints(participant: Participant): number {
    return this.getSectorPoints(participant);
  }

  getOverallRank(participant: Participant): number {
    if (!this.competitionDetails) return 0;
    const sorted = [...this.competitionDetails.participants]
      .sort((a, b) => this.getTotalPoints(b) - this.getTotalPoints(a) || 
                      this.getTotalWeightForParticipant(b.id) - this.getTotalWeightForParticipant(a.id));
    return sorted.findIndex(p => p.id === participant.id) + 1;
  }

  getSortedParticipants(): Participant[] {
    if (!this.competitionDetails) return [];
    return [...this.competitionDetails.participants]
      .sort((a, b) => {
        // Sort by sector first
        const sectorA = a.sector_name || '';
        const sectorB = b.sector_name || '';
        if (sectorA !== sectorB) {
          return sectorA.localeCompare(sectorB);
        }
        // Then by total weight within sector (descending)
        return this.getTotalWeightForParticipant(b.id) - this.getTotalWeightForParticipant(a.id);
      });
  }

  formatWeight(grams: number): string {
    if (grams >= 1000) {
      return `${(grams / 1000).toFixed(2)} kg`;
    }
    return `${grams} g`;
  }

  formatTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString('hu-HU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  getParticipantDisplayName(participant: Participant): string {
    if (participant.first_name && participant.last_name) {
      return `${participant.first_name} ${participant.last_name}`;
    }
    return participant.name;
  }

  isAdmin(): boolean {
    const user = this.authService.getCurrentUser();
    return user?.role === 'admin';
  }

  goBack(): void {
    this.router.navigate(['/competitions', this.competitionId]);
  }
}
