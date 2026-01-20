import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { API_BASE_URL } from '../config';

@Injectable({ providedIn: 'root' })
export class AuthService {
  user = signal<any>(null);

  constructor(private http: HttpClient, private router: Router) {
    this.checkSession();
  }

  checkSession() {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        if (decoded.exp * 1000 > Date.now()) {
            // Restore basic user info from token or fetch profile
            this.user.set({ email: decoded.email, role: decoded.role });
            this.fetchProfile();
        } else {
            this.logout();
        }
      } catch (e) {
        this.logout();
      }
    }
  }

  handleGoogleLogin(credential: string) {
    return this.http.post<any>(`${API_BASE_URL}/auth/google`, { credential }).subscribe({
      next: (res) => {
        localStorage.setItem('access_token', res.token);
        this.user.set(res.user);
        this.router.navigate(['/']);
      },
      error: (err) => console.error(err)
    });
  }

  fetchProfile() {
      this.http.get<any>(`${API_BASE_URL}/profile`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
      }).subscribe({
          next: (u) => this.user.set(u),
          error: () => this.logout() // invalid token
      });
  }

  logout() {
    localStorage.removeItem('access_token');
    this.user.set(null);
    this.router.navigate(['/login']);
  }
  
  isLoggedIn() {
      return !!this.user();
  }
}
