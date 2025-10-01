import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Participant, Sector } from '../models/competition.model';

@Injectable({
  providedIn: 'root'
})
export class ParticipantService {
  private apiUrl = 'https://fishing-competition-server-65i6dwswvq-uc.a.run.app/api';

  constructor(private http: HttpClient) { }

  // Get participants for a competition
  getParticipantsByCompetition(competitionId: string): Observable<Participant[]> {
    return this.http.get<Participant[]>(`${this.apiUrl}/participants/competition/${competitionId}`);
  }

  // Get participant by ID
  getParticipant(id: string): Observable<Participant> {
    return this.http.get<Participant>(`${this.apiUrl}/participants/${id}`);
  }

  // Add participant to competition
  addParticipant(participant: Partial<Participant>): Observable<Participant> {
    return this.http.post<Participant>(`${this.apiUrl}/participants`, participant);
  }

  // Update participant
  updateParticipant(id: string, participant: Partial<Participant>): Observable<Participant> {
    return this.http.put<Participant>(`${this.apiUrl}/participants/${id}`, participant);
  }

  // Delete participant
  deleteParticipant(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/participants/${id}`);
  }

  // Get available sectors for a competition
  getAvailableSectors(competitionId: string): Observable<Sector[]> {
    return this.http.get<Sector[]>(`${this.apiUrl}/participants/competition/${competitionId}/available-sectors`);
  }

  // Randomly assign participants to sectors
  randomAssignParticipants(competitionId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/participants/competition/${competitionId}/random-assign`, {});
  }
}
