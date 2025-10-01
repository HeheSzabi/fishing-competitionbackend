import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SectorResult, OverallResult, CompetitionSummary } from '../models/competition.model';

@Injectable({
  providedIn: 'root'
})
export class ResultsService {
  private apiUrl = 'https://fishing-competition-server-65i6dwswvq-uc.a.run.app/api';

  constructor(private http: HttpClient) { }

  // Get sector results for a competition
  getSectorResults(competitionId: string): Observable<SectorResult[]> {
    return this.http.get<SectorResult[]>(`${this.apiUrl}/results/competition/${competitionId}/sectors`);
  }

  // Get overall results for a competition
  getOverallResults(competitionId: string): Observable<OverallResult[]> {
    return this.http.get<OverallResult[]>(`${this.apiUrl}/results/competition/${competitionId}/overall`);
  }

  // Get competition summary
  getCompetitionSummary(competitionId: string): Observable<CompetitionSummary> {
    return this.http.get<CompetitionSummary>(`${this.apiUrl}/results/competition/${competitionId}/summary`);
  }

  // Get leaderboard for a competition
  getLeaderboard(competitionId: string, limit: number = 10): Observable<OverallResult[]> {
    return this.http.get<OverallResult[]>(`${this.apiUrl}/results/competition/${competitionId}/leaderboard?limit=${limit}`);
  }
}
