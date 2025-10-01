import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { WeighIn } from '../models/competition.model';

@Injectable({
  providedIn: 'root'
})
export class WeighInService {
  private apiUrl = 'https://fishing-competition-server-65i6dwswvq-uc.a.run.app/api';

  constructor(private http: HttpClient) { }

  // Get weigh-ins for a participant
  getWeighInsByParticipant(participantId: string): Observable<WeighIn[]> {
    return this.http.get<WeighIn[]>(`${this.apiUrl}/weigh-ins/participant/${participantId}`);
  }

  // Get weigh-ins for a competition
  getWeighInsByCompetition(competitionId: string): Observable<WeighIn[]> {
    return this.http.get<WeighIn[]>(`${this.apiUrl}/weigh-ins/competition/${competitionId}`);
  }

  // Add new weigh-in
  addWeighIn(weighIn: Partial<WeighIn>): Observable<WeighIn> {
    return this.http.post<WeighIn>(`${this.apiUrl}/weigh-ins`, weighIn);
  }

  // Update weigh-in
  updateWeighIn(id: string, weighIn: Partial<WeighIn>): Observable<WeighIn> {
    return this.http.put<WeighIn>(`${this.apiUrl}/weigh-ins/${id}`, weighIn);
  }

  // Delete weigh-in
  deleteWeighIn(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/weigh-ins/${id}`);
  }

  // Get total weight for a participant
  getTotalWeight(participantId: string): Observable<{total_weight: number}> {
    return this.http.get<{total_weight: number}>(`${this.apiUrl}/weigh-ins/participant/${participantId}/total`);
  }
}
