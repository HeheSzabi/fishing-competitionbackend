import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  streetAddress?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  photoUrl?: string;
  profileCompleted?: boolean;
  role: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'https://fishing-competition-server-65i6dwswvq-uc.a.run.app/api/auth';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Check for existing token on service initialization only in browser
    if (isPlatformBrowser(this.platformId)) {
      this.checkStoredAuth();
    }
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, credentials)
      .pipe(
        tap(response => {
          this.setAuthData(response);
        })
      );
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/register`, userData)
      .pipe(
        tap(response => {
          this.setAuthData(response);
        })
      );
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
    }
    this.currentUserSubject.next(null);
    this.router.navigate(['/']);
  }

  isAuthenticated(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }
    const token = localStorage.getItem('auth_token');
    const hasToken = !!token;
    const isExpired = token ? this.isTokenExpired(token) : true;
    const isAuth = hasToken && !isExpired;
    return isAuth;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    return localStorage.getItem('auth_token');
  }

  private setAuthData(response: AuthResponse): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('user_data', JSON.stringify(response.user));
    }
    this.currentUserSubject.next(response.user);
  }

  private checkStoredAuth(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');
    
    if (token && userData && !this.isTokenExpired(token)) {
      try {
        const user = JSON.parse(userData);
        this.currentUserSubject.next(user);
      } catch (error) {
        this.logout();
      }
    } else {
      this.logout();
    }
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  }

  // Password reset functionality
  requestPasswordReset(email: string): Observable<any> {
    return this.http.post(`${this.API_URL}/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.API_URL}/reset-password`, { token, newPassword });
  }

  // Update user profile
  updateProfile(userData: Partial<User>): Observable<User> {
    const token = this.getToken();
    const headers = { 'Authorization': `Bearer ${token}` };
    
    return this.http.put<User>(`${this.API_URL}/profile`, userData, { headers })
      .pipe(
        tap(user => {
          this.currentUserSubject.next(user);
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('user_data', JSON.stringify(user));
          }
        })
      );
  }
}
