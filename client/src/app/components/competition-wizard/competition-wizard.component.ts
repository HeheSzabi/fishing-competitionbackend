import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { CompetitionService } from '../../services/competition.service';
import { CompetitionWizardData, Competition } from '../../models/competition.model';

@Component({
  selector: 'app-competition-wizard',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    CommonModule
  ],
  templateUrl: './competition-wizard.component.html',
  styleUrls: ['./competition-wizard.component.scss']
})
export class CompetitionWizardComponent implements OnInit {
  wizardForm: FormGroup;
  loading = false;
  isEditMode = false;
  competitionId: string | null = null;
  originalCompetition: Competition | null = null;
  
  // Image upload properties
  selectedImage: File | null = null;
  imagePreview: string | null = null;

  constructor(
    private fb: FormBuilder,
    private competitionService: CompetitionService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.wizardForm = this.fb.group({
      // Competition Details
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      date: ['', Validators.required],
      location: ['', Validators.required],
      organizer: ['', Validators.required],
      contact: ['', Validators.required],
      entry_fee: ['', Validators.required],
      prizes: [''],
      
      // Schedule
      schedule: [''],
      
      // Rules & Equipment
      rules_equipment: [''],
      
      // General Rules
      general_rules: [''],
      
      // Sector Configuration
      sector_count: [3, [Validators.required, Validators.min(1), Validators.max(10)]],
      participants_per_sector: [3, [Validators.required, Validators.min(1), Validators.max(10)]]
    });
  }

  ngOnInit(): void {
    // Check if we're in edit mode
    this.competitionId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.competitionId;

    if (this.isEditMode && this.competitionId) {
      this.loadCompetitionForEdit();
    } else {
      // Set default date to today for new competitions
      const today = new Date();
      this.wizardForm.patchValue({
        date: today.toISOString().split('T')[0]
      });
    }
  }

  loadCompetitionForEdit(): void {
    if (!this.competitionId) return;
    
    this.loading = true;
    this.competitionService.getCompetition(this.competitionId).subscribe({
      next: (competitionData) => {
        this.originalCompetition = competitionData.competition;
        this.populateForm(competitionData.competition);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading competition for edit:', error);
        this.snackBar.open('Error loading competition', 'Close', { duration: 3000 });
        this.router.navigate(['/competitions']);
        this.loading = false;
      }
    });
  }

  populateForm(competition: Competition): void {
    this.wizardForm.patchValue({
      name: competition.name,
      description: competition.description,
      date: competition.date,
      location: competition.location,
      organizer: competition.organizer,
      contact: competition.contact,
      entry_fee: competition.entry_fee,
      prizes: competition.prizes,
      schedule: competition.schedule,
      rules_equipment: competition.rules_equipment,
      general_rules: competition.general_rules,
      sector_count: competition.sector_count || 3,
      participants_per_sector: competition.participants_per_sector || 3
    });
  }

  onSubmit(): void {
    if (this.wizardForm.valid) {
      this.loading = true;
      
      // Create FormData for file upload
      const formData = new FormData();
      
      // Add all form fields
      Object.keys(this.wizardForm.value).forEach(key => {
        formData.append(key, this.wizardForm.value[key]);
      });
      
      // Add image file if selected
      if (this.selectedImage) {
        formData.append('cover_image', this.selectedImage);
      }
      
      if (this.isEditMode && this.competitionId) {
        // Update existing competition
        this.competitionService.updateCompetition(this.competitionId, formData).subscribe({
          next: (response) => {
            this.snackBar.open('Competition updated successfully!', 'Close', { duration: 3000 });
            this.router.navigate(['/competitions', this.competitionId]);
          },
          error: (error) => {
            console.error('Error updating competition:', error);
            this.snackBar.open('Error updating competition', 'Close', { duration: 3000 });
            this.loading = false;
          }
        });
      } else {
        // Create new competition
        this.competitionService.createCompetition(formData).subscribe({
          next: (response) => {
            this.snackBar.open('Competition created successfully!', 'Close', { duration: 3000 });
            this.router.navigate(['/competitions', response.competition.id]);
          },
          error: (error) => {
            console.error('Error creating competition:', error);
            this.snackBar.open('Error creating competition', 'Close', { duration: 3000 });
            this.loading = false;
          }
        });
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  onCancel(): void {
    this.router.navigate(['/competitions']);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.wizardForm.controls).forEach(key => {
      const control = this.wizardForm.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.wizardForm.get(fieldName);
    if (control?.hasError('required')) {
      return `${fieldName} is required`;
    }
    if (control?.hasError('minlength')) {
      return `${fieldName} must be at least 3 characters`;
    }
    if (control?.hasError('min')) {
      return `${fieldName} must be at least 1`;
    }
    if (control?.hasError('max')) {
      return `${fieldName} must be at most 10`;
    }
    return '';
  }

  get totalParticipants(): number {
    const sectorCount = this.wizardForm.get('sector_count')?.value || 0;
    const participantsPerSector = this.wizardForm.get('participants_per_sector')?.value || 0;
    return sectorCount * participantsPerSector;
  }

  onImageSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.snackBar.open('Csak képfájlok tölthetők fel!', 'Bezár', { duration: 3000 });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.snackBar.open('A kép mérete nem lehet nagyobb 5MB-nál!', 'Bezár', { duration: 3000 });
        return;
      }
      
      this.selectedImage = file;
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(): void {
    this.selectedImage = null;
    this.imagePreview = null;
    
    // Reset file input
    const fileInput = document.getElementById('coverImage') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

}
