import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-profile-completion',
  standalone: true,
  imports: [
    RouterLink,
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule
  ],
  templateUrl: './profile-completion.component.html',
  styleUrls: ['./profile-completion.component.scss']
})
export class ProfileCompletionComponent implements OnInit {
  profileForm: FormGroup;
  isLoading = false;
  photoPreview: string | null = null;
  selectedFile: File | null = null;
  currentUser: any = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private http: HttpClient,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.profileForm = this.fb.group({
      phone: ['', [Validators.pattern(/^[0-9+\-\s()]*$/)]],
      streetAddress: ['', [Validators.required]],
      city: ['', [Validators.required]],
      postalCode: ['', [Validators.required]],
      country: ['Hungary', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadCurrentUser();
  }

  loadCurrentUser(): void {
    this.currentUser = this.authService.getCurrentUser();
    
    // Load full profile from API
    const token = this.authService.getToken();
    const headers = { 'Authorization': `Bearer ${token}` };
    
    this.http.get('http://localhost:3001/api/auth/profile', { headers }).subscribe({
      next: (profile: any) => {
        this.profileForm.patchValue({
          phone: profile.phone || '',
          streetAddress: profile.streetAddress || '',
          city: profile.city || '',
          postalCode: profile.postalCode || '',
          country: profile.country || 'Hungary'
        });
        
        if (profile.photoUrl) {
          this.photoPreview = `http://localhost:3001${profile.photoUrl}`;
        }
      },
      error: (error) => {
        console.error('Error loading profile:', error);
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Validate file type
      if (!file.type.match(/image\/(jpeg|jpg|png|gif|webp)/)) {
        this.snackBar.open('Csak képfájlok engedélyezettek (JPEG, PNG, GIF, WEBP)', 'Bezárás', { 
          duration: 3000 
        });
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        this.snackBar.open('A fájl mérete maximum 5MB lehet', 'Bezárás', { 
          duration: 3000 
        });
        return;
      }
      
      this.selectedFile = file;
      
      // Show preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.photoPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removePhoto(): void {
    this.selectedFile = null;
    this.photoPreview = null;
    
    // If user had a photo on server, delete it
    if (this.currentUser?.photoUrl) {
      const token = this.authService.getToken();
      const headers = { 'Authorization': `Bearer ${token}` };
      
      this.http.delete('http://localhost:3001/api/auth/profile/photo', { headers }).subscribe({
        next: () => {
          this.snackBar.open('Fotó törölve', 'Bezárás', { duration: 2000 });
        },
        error: (error) => {
          console.error('Error deleting photo:', error);
        }
      });
    }
  }

  async onSubmit(): Promise<void> {
    if (this.profileForm.invalid) {
      this.snackBar.open('Kérlek töltsd ki az összes kötelező mezőt', 'Bezárás', { 
        duration: 3000 
      });
      return;
    }

    this.isLoading = true;

    try {
      // Upload photo first if selected
      if (this.selectedFile) {
        await this.uploadPhoto();
      }

      // Update profile
      const profileData = {
        ...this.profileForm.value,
        profileCompleted: true
      };

      this.authService.updateProfile(profileData).subscribe({
        next: (updatedUser) => {
          this.isLoading = false;
          this.snackBar.open('Profilod sikeresen mentve!', 'Bezárás', { 
            duration: 3000 
          });
          
          // Redirect to competitions page
          this.router.navigate(['/competitions']);
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error updating profile:', error);
          this.snackBar.open('Hiba történt a profil mentése során', 'Bezárás', { 
            duration: 3000 
          });
        }
      });

    } catch (error) {
      this.isLoading = false;
      console.error('Error in profile completion:', error);
      this.snackBar.open('Hiba történt', 'Bezárás', { 
        duration: 3000 
      });
    }
  }

  private uploadPhoto(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.selectedFile) {
        resolve();
        return;
      }

      const formData = new FormData();
      formData.append('photo', this.selectedFile);
      
      const token = this.authService.getToken();
      const headers = { 'Authorization': `Bearer ${token}` };

      this.http.post('http://localhost:3001/api/auth/profile/photo', formData, { headers }).subscribe({
        next: () => {
          resolve();
        },
        error: (error) => {
          console.error('Error uploading photo:', error);
          this.snackBar.open('Hiba a fotó feltöltése során', 'Bezárás', { 
            duration: 3000 
          });
          reject(error);
        }
      });
    });
  }

  skipForNow(): void {
    this.router.navigate(['/competitions']);
  }
}

