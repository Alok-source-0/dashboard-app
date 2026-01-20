import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../config';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-8 max-w-6xl mx-auto min-h-screen">
      <h1 class="text-3xl font-bold mb-8 text-gray-800 dark:text-gray-100">Admin Panel</h1>
      
      <!-- Users Section -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-8 border dark:border-gray-700">
        <h2 class="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">User Management</h2>
        <div class="overflow-x-auto">
            <table class="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                <thead class="bg-gray-50 dark:bg-gray-700 font-bold">
                    <tr>
                        <th class="p-3">Name</th>
                        <th class="p-3">Email</th>
                        <th class="p-3">Role</th>
                        <th class="p-3">Joined</th>
                        <th class="p-3">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr *ngFor="let u of users" class="border-b dark:border-gray-700">
                        <td class="p-3 flex items-center gap-2">
                             <img [src]="u.picture" class="w-6 h-6 rounded-full" /> {{u.name}}
                        </td>
                        <td class="p-3">{{u.email}}</td>
                        <td class="p-3">
                            <span class="px-2 py-1 rounded-full text-xs font-semibold" 
                                  [ngClass]="u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'">
                                {{u.role}}
                            </span>
                        </td>
                        <td class="p-3">{{u.createdAt | date}}</td>
                        <td class="p-3">
                             <button *ngIf="u.role !== 'admin'" (click)="makeAdmin(u._id)" class="text-blue-600 hover:underline">Promote</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
      </div>

       <!-- Data Stats Section -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6 border dark:border-gray-700">
        <h2 class="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">System Data Stats</h2>
        <p class="mb-4 text-gray-600 dark:text-gray-400">Total Financial Records: {{ recordCount }}</p>
        
        <button (click)="deleteAllData()" class="bg-red-600 text-white px-4 py-2 rounded shadow hover:bg-red-700">
             ⚠️ Delete All Financial Data
        </button>
      </div>
    </div>
  `
})
export class AdminComponent implements OnInit {
  users: any[] = [];
  recordCount: number = 0;

  constructor(private http: HttpClient) {}

  ngOnInit() {
      this.loadUsers();
      this.loadStats();
  }

  loadUsers() {
      this.http.get<any[]>(`${API_BASE_URL}/api/admin/users`).subscribe(res => this.users = res);
  }

  loadStats() {
       this.http.get<any>(`${API_BASE_URL}/api/admin/stats`).subscribe(res => this.recordCount = res.count);
  }

  makeAdmin(id: string) {
      if(!confirm('Promote user to admin?')) return;
      this.http.post(`${API_BASE_URL}/api/admin/promote/${id}`, {}).subscribe(() => this.loadUsers());
  }

  deleteAllData() {
      if(!confirm('Are you SURE? This will wipe all financial data!')) return;
      this.http.delete(`${API_BASE_URL}/api/admin/data`).subscribe(() => {
          alert('Data cleared');
          this.loadStats();
      }, err => alert('Failed: ' + err.message));
  }
}
