import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Competition, CompetitionDetails, Sector, Participant } from '../models/competition.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class CompetitionService {
  private apiUrl = 'https://fishing-competition-server-65i6dwswvq-uc.a.run.app/api';

  constructor(private http: HttpClient, private authService: AuthService) { }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private getAuthHeadersForFormData(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
      // Don't set Content-Type for FormData - let browser set it with boundary
    });
  }

  // Get all competitions
  getCompetitions(): Observable<Competition[]> {
    return this.http.get<Competition[]>(`${this.apiUrl}/competitions`);
  }

  // Get competition by ID with full details
  getCompetition(id: string): Observable<CompetitionDetails> {
    return this.http.get<CompetitionDetails>(`${this.apiUrl}/competitions/${id}`);
  }

  // Create new competition
  createCompetition(competition: Partial<Competition> | FormData): Observable<{competition: Competition, sectors: Sector[]}> {
    const headers = competition instanceof FormData ? this.getAuthHeadersForFormData() : this.getAuthHeaders();
    return this.http.post<{competition: Competition, sectors: Sector[]}>(`${this.apiUrl}/competitions`, competition, {
      headers: headers
    });
  }

  // Update competition
  updateCompetition(id: string, competition: Partial<Competition> | FormData): Observable<Competition> {
    const headers = competition instanceof FormData ? this.getAuthHeadersForFormData() : this.getAuthHeaders();
    return this.http.put<Competition>(`${this.apiUrl}/competitions/${id}`, competition, {
      headers: headers
    });
  }

  // Delete competition
  deleteCompetition(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/competitions/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  // Get competition summary
  getCompetitionSummary(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/results/competition/${id}/summary`);
  }
}
