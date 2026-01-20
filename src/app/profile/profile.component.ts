import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-8 max-w-2xl mx-auto min-h-screen">
      <h1 class="text-3xl font-bold mb-8 text-gray-800 dark:text-gray-100">My Profile</h1>
      
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6 flex flex-col items-center sm:flex-row gap-6">
        <img [src]="user()?.picture || 'https://via.placeholder.com/100'" 
             class="w-24 h-24 rounded-full border-4 border-gray-100 dark:border-gray-700 shadow-sm"
             alt="Profile">
             
        <div class="text-center sm:text-left">
          <h2 class="text-2xl font-semibold text-gray-800 dark:text-gray-100">{{ user()?.name }}</h2>
          <p class="text-gray-500 dark:text-gray-400 mb-4">{{ user()?.email }}</p>
          
          <div class="inline-flex px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-medium">
            Role: {{ user()?.role | titlecase }}
          </div>
          
          <div class="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
             <div>
               <p class="font-bold">Member Since</p>
               <p>{{ user()?.createdAt | date:'mediumDate' }}</p>
             </div>
             <div>
               <p class="font-bold">Status</p>
               <p class="text-green-600 dark:text-green-400">Active</p>
             </div>
          </div>
        </div>
      </div>
      
      <div class="mt-8">
        <button (click)="auth.logout()" class="text-red-600 hover:text-red-700 font-medium">
          Sign out
        </button>
      </div>
    </div>
  `
})
export class ProfileComponent {
  constructor(public auth: AuthService) {}
  
  get user() { return this.auth.user; }
}
