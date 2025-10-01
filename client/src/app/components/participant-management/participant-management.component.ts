import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { ParticipantService } from '../../services/participant.service';
import { CompetitionService } from '../../services/competition.service';
import { WeighInService } from '../../services/weigh-in.service';
import { Participant, Sector, CompetitionDetails, WeighIn } from '../../models/competition.model';

@Component({
  selector: 'app-participant-management',
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
    MatProgressSpinnerModule
  ],
  templateUrl: './participant-management.component.html',
  styleUrls: ['./participant-management.component.scss']
})
export class ParticipantManagementComponent implements OnInit {
  competitionId: string = '';
  competitionDetails: CompetitionDetails | null = null;
  participants: Participant[] = [];
  availableSectors: Sector[] = [];
  weighIns: WeighIn[] = [];
  loading = false;
  showAddForm = false;

  addParticipantForm: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private participantService: ParticipantService,
    private competitionService: CompetitionService,
    private weighInService: WeighInService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private fb: FormBuilder
  ) {
    this.addParticipantForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      sector_id: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.competitionId = this.route.snapshot.paramMap.get('id') || '';
    this.loadCompetitionDetails();
    this.loadAvailableSectors();
    this.loadWeighIns();
  }

  loadCompetitionDetails(): void {
    this.loading = true;
    this.competitionService.getCompetition(this.competitionId).subscribe({
      next: (details) => {
        this.competitionDetails = details;
        this.participants = details.participants;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading competition details:', error);
        this.snackBar.open('Error loading competition details', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  loadAvailableSectors(): void {
    this.participantService.getAvailableSectors(this.competitionId).subscribe({
      next: (sectors) => {
        this.availableSectors = sectors;
      },
      error: (error) => {
        console.error('Error loading available sectors:', error);
      }
    });
  }

  toggleAddForm(): void {
    this.showAddForm = !this.showAddForm;
    if (this.showAddForm) {
      this.addParticipantForm.reset();
    }
  }

  onSubmitAddParticipant(): void {
    if (this.addParticipantForm.valid) {
      const formData = this.addParticipantForm.value;
      formData.competition_id = this.competitionId;

      this.participantService.addParticipant(formData).subscribe({
        next: (participant) => {
          this.snackBar.open('Participant added successfully!', 'Close', { duration: 3000 });
          this.loadCompetitionDetails();
          this.loadAvailableSectors();
          this.showAddForm = false;
          this.addParticipantForm.reset();
        },
        error: (error) => {
          console.error('Error adding participant:', error);
          this.snackBar.open('Error adding participant', 'Close', { duration: 3000 });
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  deleteParticipant(participant: Participant): void {
    if (confirm(`Are you sure you want to remove "${participant.name}" from the competition?`)) {
      this.participantService.deleteParticipant(participant.id).subscribe({
        next: () => {
          this.snackBar.open('Participant removed successfully!', 'Close', { duration: 3000 });
          this.loadCompetitionDetails();
          this.loadAvailableSectors();
        },
        error: (error) => {
          console.error('Error removing participant:', error);
          this.snackBar.open('Error removing participant', 'Close', { duration: 3000 });
        }
      });
    }
  }

  moveParticipant(participant: Participant, newSectorId: string): void {
    if (participant.sector_id === newSectorId) return;

    this.participantService.updateParticipant(participant.id, { sector_id: newSectorId }).subscribe({
      next: () => {
        this.snackBar.open('Participant moved successfully!', 'Close', { duration: 3000 });
        this.loadCompetitionDetails();
        this.loadAvailableSectors();
      },
      error: (error) => {
        console.error('Error moving participant:', error);
        this.snackBar.open('Error moving participant', 'Close', { duration: 3000 });
      }
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.addParticipantForm.controls).forEach(key => {
      const control = this.addParticipantForm.get(key);
      control?.markAsTouched();
    });
  }

  getParticipantsBySector(sectorName: string): Participant[] {
    return this.participants.filter(p => p.sector_name === sectorName);
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

  getSortedParticipants(): Participant[] {
    if (!this.competitionDetails) return [];
    return [...this.competitionDetails.participants]
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  getWeighInsForParticipant(participantId: string): WeighIn[] {
    return this.weighIns.filter(w => w.participant_id === participantId);
  }

  getTotalWeightForParticipant(participantId: string): number {
    return this.getWeighInsForParticipant(participantId)
      .reduce((total, weighIn) => total + weighIn.weight_grams, 0);
  }

  getSectorRank(participant: Participant): number {
    if (!participant.sector_name) return 0;
    
    const sectorParticipants = this.competitionDetails?.participants
      .filter(p => p.sector_name === participant.sector_name) || [];
    
    const sortedByWeight = sectorParticipants.sort((a, b) => 
      this.getTotalWeightForParticipant(b.id) - this.getTotalWeightForParticipant(a.id)
    );
    
    return sortedByWeight.findIndex(p => p.id === participant.id) + 1;
  }

  getSectorPoints(participant: Participant): number {
    const rank = this.getSectorRank(participant);
    if (rank === 0) return 0;
    
    // Points system: 1st = 10, 2nd = 8, 3rd = 6, 4th = 4, 5th = 2, others = 1
    const points = [10, 8, 6, 4, 2];
    return rank <= points.length ? points[rank - 1] : 1;
  }

  getTotalPoints(participant: Participant): number {
    return this.getSectorPoints(participant);
  }

  getOverallRank(participant: Participant): number {
    if (!this.competitionDetails) return 0;
    
    const sorted = [...this.competitionDetails.participants].sort((a, b) => 
      this.getTotalPoints(b) - this.getTotalPoints(a) ||
      this.getTotalWeightForParticipant(b.id) - this.getTotalWeightForParticipant(a.id)
    );
    
    return sorted.findIndex(p => p.id === participant.id) + 1;
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

  getSectorById(sectorId: string): Sector | undefined {
    return this.availableSectors.find(s => s.id === sectorId);
  }

  getErrorMessage(fieldName: string): string {
    const control = this.addParticipantForm.get(fieldName);
    if (control?.hasError('required')) {
      return `${fieldName} is required`;
    }
    if (control?.hasError('minlength')) {
      return `${fieldName} must be at least 2 characters`;
    }
    return '';
  }

  exportToCSV(): void {
    if (!this.competitionDetails) return;

    const participants = this.getSortedParticipants();
    const csvData = this.prepareExportData(participants);
    const csvContent = this.convertToCSV(csvData);
    this.downloadFile(csvContent, 'participants.csv', 'text/csv');
  }

  exportToExcel(): void {
    if (!this.competitionDetails) return;

    const participants = this.getSortedParticipants();
    const excelData = this.prepareExportData(participants);
    const excelContent = this.convertToExcel(excelData);
    this.downloadFile(excelContent, 'participants.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  }

  private prepareExportData(participants: Participant[]): any[] {
    return participants.map(participant => {
      const weighIns = this.getWeighInsForParticipant(participant.id);
      const totalWeight = this.getTotalWeightForParticipant(participant.id);
      const sectorRank = this.getSectorRank(participant);
      const overallRank = this.getOverallRank(participant);
      
      return {
        'Név': participant.name,
        'Szektor': participant.sector_name || 'Nincs szektor',
        'Mérlegelések száma': weighIns.length,
        'Összfogás (g)': totalWeight,
        'Szektorhelyezés': sectorRank,
        'Összetett helyezés': overallRank,
        'Utolsó mérés': weighIns.length > 0 ? this.formatTime(weighIns[weighIns.length - 1].created_at) : 'Nincs mérés'
      };
    });
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    
    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      });
      csvRows.push(values.join(','));
    });
    
    return csvRows.join('\n');
  }

  private convertToExcel(data: any[]): string {
    // Simple XML format for Excel compatibility
    let xml = '<?xml version="1.0"?>\n';
    xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet">\n';
    xml += '<Worksheet ss:Name="Résztvevők">\n';
    xml += '<Table>\n';
    
    if (data.length > 0) {
      // Headers
      const headers = Object.keys(data[0]);
      xml += '<Row>\n';
      headers.forEach(header => {
        xml += `<Cell><Data ss:Type="String">${header}</Data></Cell>\n`;
      });
      xml += '</Row>\n';
      
      // Data rows
      data.forEach(row => {
        xml += '<Row>\n';
        headers.forEach(header => {
          const value = row[header];
          const type = typeof value === 'number' ? 'Number' : 'String';
          xml += `<Cell><Data ss:Type="${type}">${value}</Data></Cell>\n`;
        });
        xml += '</Row>\n';
      });
    }
    
    xml += '</Table>\n';
    xml += '</Worksheet>\n';
    xml += '</Workbook>';
    
    return xml;
  }

  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
    
    this.snackBar.open(`${filename} letöltve!`, 'Bezár', { duration: 3000 });
  }
}
