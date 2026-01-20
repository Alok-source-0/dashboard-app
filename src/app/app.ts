import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common'; // added
import { ThemeService } from './services/theme.service';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive], // Removed direct DashboardComponent import as retrieved via router
  template: `
    <nav class="bg-white dark:bg-gray-800 shadow-md transition-colors duration-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex">
            <div class="flex-shrink-0 flex items-center cursor-pointer">
              <a routerLink="/" class="text-xl font-bold text-blue-600 dark:text-blue-400 no-underline">FinDash</a>
            </div>
            <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
              <a routerLink="/" routerLinkActive="border-blue-500 text-gray-900 dark:text-gray-100" 
                 [routerLinkActiveOptions]="{exact: true}"
                 class="border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                Dashboard
              </a>
              <a routerLink="/profile" routerLinkActive="border-blue-500 text-gray-900 dark:text-gray-100"
                 class="border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                Profile
              </a>
              <a *ngIf="auth.user()?.role === 'admin'" routerLink="/admin" routerLinkActive="border-blue-500 text-gray-900 dark:text-gray-100"
                 class="border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                Admin
              </a>
            </div>
          </div>
          
          <div class="flex items-center gap-4">
            <!-- Theme Cycle Button (Simpler than dropdown) -->
            <button (click)="cycleTheme()" class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 focus:outline-none transition-colors" title="Toggle Theme">
                 <span *ngIf="themeService.currentTheme() === 'light'">☀️</span>
                 <span *ngIf="themeService.currentTheme() === 'dark'">🌙</span>
                 <span *ngIf="themeService.currentTheme() === 'system'">🖥️</span>
            </button>

            <!-- Profile/Login -->
            <ng-container *ngIf="auth.user() as user; else loginBtn">
                 <a routerLink="/profile" class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 cursor-pointer">
                    <img [src]="user.picture || 'https://via.placeholder.com/32'" class="h-8 w-8 rounded-full border dark:border-gray-600" alt="">
                    <span class="hidden md:block">{{ user.name }}</span>
                 </a>
            </ng-container>
            <ng-template #loginBtn>
                <a routerLink="/login" class="text-white bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium">Sign In</a>
            </ng-template>
          </div>
        </div>
      </div>
    </nav>
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <router-outlet></router-outlet>
    </div>
  `,
  styleUrl: './app.css'
})
export class App {
  constructor(public themeService: ThemeService, public auth: AuthService) {}

  cycleTheme() {
    const current = this.themeService.currentTheme();
    if (current === 'light') this.themeService.setTheme('dark');
    else if (current === 'dark') this.themeService.setTheme('system');
    else this.themeService.setTheme('light');
  }
}
