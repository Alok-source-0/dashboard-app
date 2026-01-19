import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private apiUrl = '';

  constructor(private http: HttpClient) {}

  uploadFile(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.apiUrl}/uploadcsv`, formData);
  }

  getFinancialData(year: string, month: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/data?year=${year}&month=${month}`);
  }

  getYears(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/years`);
  }
}
