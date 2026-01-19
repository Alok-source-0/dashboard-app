import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // added for *ngFor, currency pipe, etc
import { FormsModule } from '@angular/forms'; // added for ngModel
import { DashboardService } from './dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent {
  data: any[] = [];
  groupedData: any[] = [];
  
  constructor(private dashboardService: DashboardService) {
    this.fetchData();
  }

  onFileUpload(event: any) {
    const file = event.target.files[0];
    if (file) {
      console.log('Uploading file:', file.name);
      this.dashboardService.uploadFile(file).subscribe({
        next: (res) => {
          console.log('Upload successful', res);
          alert('Upload Successful');
          this.fetchData(); // Auto-refresh data after upload
        },
        error: (err) => {
          console.error('Upload failed', err);
          alert('Upload Failed: ' + err.message);
        }
      });
    }
  }

  fetchData() {
    console.log(`Fetching all data`);
    
    this.dashboardService.getFinancialData('', '')
      .subscribe({
        next: (res) => {
          console.log('Data received:', res);
          this.data = this.sortData(res);
          this.groupDataByYear();
        },
        error: (err) => {
          console.error('Fetch failed', err);
        }
      });
  }

  groupDataByYear() {
    const groups: { [key: string]: any[] } = {};
    this.data.forEach(d => {
      if (!groups[d.year]) {
        groups[d.year] = [];
      }
      groups[d.year].push(d);
    });
    
    // Sort years if needed
    this.groupedData = Object.keys(groups).sort().map(year => {
      return {
        year: year,
        items: groups[year]
      };
    });
  }

  sortData(data: any[]) {
    const monthOrder = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
    const getMonthIndex = (m: string) => {
        const idx = monthOrder.findIndex(mo => m && m.startsWith(mo));
        return idx === -1 ? 99 : idx;
    };
    
    return data.sort((a, b) => {
      // Sort by Year first (descending or ascending? assuming ascending FY)
      if (a.year !== b.year) {
         return a.year.localeCompare(b.year);
      }
      // Then by Month
      return getMonthIndex(a.month) - getMonthIndex(b.month);
    });
  }

  // Use backend provided calculations
  getDifference(item: any) {
    return item.net_revenue;
  }

  getPercentage(item: any) {
    return item.percentage * 100;
  }
}
