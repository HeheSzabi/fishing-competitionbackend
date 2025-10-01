import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface CompetitionRegistration {
  id: string;
  user_id: number;
  competition_id: string;
  status: 'registered' | 'withdrawn' | 'confirmed';
  registration_date: string;
  withdrawal_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  competition_name?: string;
  date?: string;
  location?: string;
  description?: string;
}

export interface RegistrationStats {
  registered_count: number;
  withdrawn_count: number;
  total_count: number;
}

export interface RegistrationCheckResponse {
  isRegistered: boolean;
  registration: CompetitionRegistration | null;
}

@Injectable({
  providedIn: 'root'
})
export class RegistrationService {
  private readonly API_URL = 'https://fishing-competition-server-65i6dwswvq-uc.a.run.app/api/registrations';
  private registrationsSubject = new BehaviorSubject<CompetitionRegistration[]>([]);
  public registrations$ = this.registrationsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  // Get all registrations for a user
  getUserRegistrations(userId: number): Observable<CompetitionRegistration[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<CompetitionRegistration[]>(`${this.API_URL}/user/${userId}`, { headers })
      .pipe(
        tap(registrations => {
          this.registrationsSubject.next(registrations);
        })
      );
  }

  // Get all registrations for a competition
  getCompetitionRegistrations(competitionId: string): Observable<CompetitionRegistration[]> {
    return this.http.get<CompetitionRegistration[]>(`${this.API_URL}/competition/${competitionId}`);
  }

  // Check if user is registered for a competition
  checkRegistration(competitionId: string): Observable<RegistrationCheckResponse> {
    const headers = this.getAuthHeaders();
    return this.http.get<RegistrationCheckResponse>(`${this.API_URL}/check/${competitionId}`, { headers });
  }

  // Register for a competition
  registerForCompetition(competitionId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>(`${this.API_URL}/register`, { competitionId }, { headers });
  }

  // Withdraw from a competition
  withdrawFromCompetition(competitionId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>(`${this.API_URL}/withdraw`, { competitionId }, { headers });
  }

  // Get registration statistics
  getRegistrationStats(competitionId: string): Observable<RegistrationStats> {
    return this.http.get<RegistrationStats>(`${this.API_URL}/stats/${competitionId}`);
  }

  // Clear cached registrations
  clearCache(): void {
    this.registrationsSubject.next([]);
  }
}

