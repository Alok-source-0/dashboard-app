import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';

declare const google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <div class="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md text-center">
        <h2 class="text-3xl font-bold mb-2 text-gray-800 dark:text-gray-100">Welcome Back</h2>
        <p class="text-gray-600 dark:text-gray-400 mb-8">Sign in to access your financial dashboard</p>
        
        <div id="google-btn" class="flex justify-center mb-4"></div>
        
        <p class="text-xs text-gray-400 mt-4">
          By signing in, you agree to our Terms of Service.
        </p>
      </div>
    </div>
  `
})
export class LoginComponent implements AfterViewInit {
  constructor(private auth: AuthService) {}

  ngAfterViewInit() {
    this.ensureGoogleLibraryLoaded();
  }

  ensureGoogleLibraryLoaded() {
    if (typeof google !== 'undefined' && google.accounts) {
      this.initGoogleLogin();
    } else {
      // Retry every 100ms
      const interval = setInterval(() => {
        if (typeof google !== 'undefined' && google.accounts) {
          clearInterval(interval);
          this.initGoogleLogin();
        }
      }, 100);
    }
  }

  initGoogleLogin() {
    google.accounts.id.initialize({
      client_id: '1094124209252-6blujbd6542ppcqbloi21l57ed4jofem.apps.googleusercontent.com',
      callback: (resp: any) => {
        console.log('Google Response:', resp);
        this.auth.handleGoogleLogin(resp.credential);
      }
    });
    
    const btnParams = { theme: 'outline', size: 'large', type: 'standard', width: 250 };
    google.accounts.id.renderButton(
      document.getElementById('google-btn'),
      btnParams
    );
    
    // google.accounts.id.prompt(); // Optional: shows the one-tap dialog
  }
}
