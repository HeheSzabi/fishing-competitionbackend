import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { ResultsService } from '../../services/results.service';
import { CompetitionService } from '../../services/competition.service';
import { SectorResult, OverallResult, CompetitionSummary } from '../../models/competition.model';

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatSnackBarModule
  ],
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.scss']
})
export class ResultsComponent implements OnInit {
  competitionId: string = '';
  competitionName: string = '';
  summary: CompetitionSummary | null = null;
  sectorResults: SectorResult[] = [];
  overallResults: OverallResult[] = [];
  loading = false;
  activeTab = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private resultsService: ResultsService,
    private competitionService: CompetitionService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.competitionId = this.route.snapshot.paramMap.get('id') || '';
    this.loadCompetitionName();
    this.loadSummary();
    this.loadSectorResults();
    this.loadOverallResults();
  }

  loadCompetitionName(): void {
    this.competitionService.getCompetition(this.competitionId).subscribe({
      next: (details) => {
        this.competitionName = details.competition.name;
      },
      error: (error) => {
        console.error('Error loading competition name:', error);
      }
    });
  }

  loadSummary(): void {
    this.resultsService.getCompetitionSummary(this.competitionId).subscribe({
      next: (summary) => {
        this.summary = summary;
      },
      error: (error) => {
        console.error('Error loading competition summary:', error);
        this.snackBar.open('Error loading competition summary', 'Close', { duration: 3000 });
      }
    });
  }

  loadSectorResults(): void {
    this.loading = true;
    this.resultsService.getSectorResults(this.competitionId).subscribe({
      next: (results) => {
        this.sectorResults = results;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading sector results:', error);
        this.snackBar.open('Error loading sector results', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  loadOverallResults(): void {
    this.resultsService.getOverallResults(this.competitionId).subscribe({
      next: (results) => {
        this.overallResults = results;
      },
      error: (error) => {
        console.error('Error loading overall results:', error);
        this.snackBar.open('Error loading overall results', 'Close', { duration: 3000 });
      }
    });
  }

  getResultsBySector(sectorName: string): SectorResult[] {
    return this.sectorResults
      .filter(r => r.sector_name === sectorName)
      .sort((a, b) => a.sector_rank - b.sector_rank);
  }

  getSectorNames(): string[] {
    return [...new Set(this.sectorResults.map(r => r.sector_name))].sort();
  }

  formatWeight(grams: number): string {
    if (grams >= 1000) {
      return `${(grams / 1000).toFixed(2)} kg`;
    }
    return `${grams} g`;
  }

  getMedalIcon(rank: number): string {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '';
  }

  getRankColor(rank: number): string {
    if (rank === 1) return '#ffd700';
    if (rank === 2) return '#c0c0c0';
    if (rank === 3) return '#cd7f32';
    return '';
  }

  onTabChange(index: number): void {
    this.activeTab = index;
  }

  goBack(): void {
    this.router.navigate(['/competitions', this.competitionId]);
  }
}
