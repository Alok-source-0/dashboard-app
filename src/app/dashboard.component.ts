import { Component, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // added for *ngFor, currency pipe, etc
import { FormsModule } from '@angular/forms'; // added for ngModel
import { DashboardService } from './dashboard.service';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  data: any[] = [];
  groupedData: any[] = [];
  
  // AI Summary
  aiSummary: string = '';
  isLoadingSummary: boolean = false;
  
  // Chart Configuration
  @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;
  
  public chartType: ChartType = 'bar';
  public chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true },
    }
  };
  
  public chartData: ChartData<'bar' | 'line' | 'pie' | 'doughnut' | 'radar'> = {
    labels: [],
    datasets: [ { data: [], label: 'Net Revenue' }, { data: [], label: 'Spend' } ]
  };

  public chartTypes: ChartType[] = ['bar', 'line', 'pie', 'doughnut', 'radar'];
  public comparisonModes: string[] = ['Monthly', 'Annual', 'Seasonal'];
  public selectedComparisonMode: string = 'Monthly';
  public selectedYearForChart: string = 'All';
  public availableYears: string[] = ['All'];
  
  // New properties for Table View
  public selectedTableYear: string = '';
  public tableMonths: any[] = []; // Stores { fullLabel, monthName, yearData }
  public tableTotals: any = {};
  public monthNames = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

  constructor(private dashboardService: DashboardService) {}

  ngOnInit() {
    this.fetchData();
    // fetchYears is called after upload or init.
    // We will hook into it to set default selectedTableYear
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
          this.extractYears();
          this.groupDataByYear();
          this.updateChart();
          this.updateTableView();
        },
        error: (err) => {
          console.error('Fetch failed', err);
        }
      });
  }

  extractYears() {
      // Get unique years from data
      const years = Array.from(new Set(this.data.map(d => d.year))).sort();
      this.availableYears = ['All', ...years];
      
      // Default table selection to latest year if not set
      if (!this.selectedTableYear && years.length > 0) {
          this.selectedTableYear = years[years.length - 1];
      }
  }
  
  // Prepare data for the 12-month table view
  updateTableView() {
      if (!this.selectedTableYear || this.selectedTableYear === 'All') {
           // If 'All' is selected or nothing, just allow the user to pick. 
           // But for the specific "matric" view, we need a single FY context to render columns properly.
           // We will default to the first available real year if 'All' is current.
           const realYear = this.availableYears.find(y => y !== 'All');
           if (realYear) this.selectedTableYear = realYear;
           else return;
      }
      
      const yearData = this.data.filter(d => d.year === this.selectedTableYear);
      
      // 1. Build Columns (Apr -> Mar)
      this.tableMonths = this.monthNames.map(m => {
          // Find data for this month
          const record = yearData.find(d => d.month.startsWith(m));
          
          // Determine Label Year (e.g. Apr 23 vs Jan 24)
          // Parse FY string "F.Y. 2023-24" -> Base 2023
          let yearSuffix = '';
          const fyMatch = this.selectedTableYear.match(/20(\d{2})/);
          let baseYear = fyMatch ? parseInt(fyMatch[1], 10) : 0;
          
          if (['Jan', 'Feb', 'Mar'].includes(m)) {
              yearSuffix = (baseYear + 1).toString();
          } else {
              yearSuffix = baseYear.toString();
          }
          
          return {
              label: `${m}, ${yearSuffix}`,
              data: record || null
          };
      });

      // 2. Calculate Totals
      const totalRev = yearData.reduce((acc, curr) => acc + (curr.revenue || 0), 0);
      const totalReturn = yearData.reduce((acc, curr) => acc + Math.abs(curr.return || 0), 0);
      const totalSpent = yearData.reduce((acc, curr) => acc + (curr.spent || 0), 0);
      
      const totalDiff = totalRev - totalReturn;
      const totalEff = totalDiff !== 0 ? (totalSpent / totalDiff) * 100 : 0;
      
      this.tableTotals = {
          spent: totalSpent,
          revenue: totalRev,
          return: totalReturn,
          difference: totalDiff,
          efficiency: totalEff
      };
  }

  onTableYearChange() {
      this.updateTableView();
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

  // Chart Logic
  updateChart() {
    if (!this.data || this.data.length === 0) return;

    let filteredData = this.data;
    // Filter by year if specific year selected (unless comparing Annual trends)
    if (this.selectedYearForChart !== 'All' && this.selectedComparisonMode === 'Monthly') {
      filteredData = this.data.filter(d => d.year === this.selectedYearForChart);
    }

    let labels: string[] = [];
    let revenueData: number[] = [];
    let spendData: number[] = [];

    if (this.selectedComparisonMode === 'Annual') {
        const years = Array.from(new Set(this.data.map(d => d.year))).sort();
        labels = years;
        years.forEach(y => {
            const yearData = this.data.filter(d => d.year === y);
            const totalRev = yearData.reduce((sum, d) => sum + d.net_revenue, 0);
            const totalSpend = yearData.reduce((sum, d) => sum + d.spent, 0);
            revenueData.push(totalRev);
            spendData.push(totalSpend);
        });
    } else if (this.selectedComparisonMode === 'Seasonal') {
         labels = ['Q1 (Apr-Jun)', 'Q2 (Jul-Sep)', 'Q3 (Oct-Dec)', 'Q4 (Jan-Mar)'];
         const qMap: any = { 'Q1': 0, 'Q2': 0, 'Q3': 0, 'Q4': 0 };
         const qSpendMap: any = { 'Q1': 0, 'Q2': 0, 'Q3': 0, 'Q4': 0 };
         
         const qBuckets = [
             ['Apr', 'May', 'Jun'],
             ['Jul', 'Aug', 'Sep'],
             ['Oct', 'Nov', 'Dec'],
             ['Jan', 'Feb', 'Mar']
         ];
         
         filteredData.forEach(d => {
             const m = d.month;
             let qIndex = -1;
             qBuckets.forEach((bucket, idx) => {
                 if (bucket.some(bm => m.startsWith(bm))) qIndex = idx;
             });
             if (qIndex !== -1) {
                 if (qIndex === 0) { qMap['Q1'] += d.net_revenue; qSpendMap['Q1'] += d.spent; }
                 if (qIndex === 1) { qMap['Q2'] += d.net_revenue; qSpendMap['Q2'] += d.spent; }
                 if (qIndex === 2) { qMap['Q3'] += d.net_revenue; qSpendMap['Q3'] += d.spent; }
                 if (qIndex === 3) { qMap['Q4'] += d.net_revenue; qSpendMap['Q4'] += d.spent; }
             }
         });
         
         revenueData = [qMap['Q1'], qMap['Q2'], qMap['Q3'], qMap['Q4']];
         spendData = [qSpendMap['Q1'], qSpendMap['Q2'], qSpendMap['Q3'], qSpendMap['Q4']];

    } else {
        // Monthly
        labels = filteredData.map(d => this.selectedYearForChart === 'All' ? `${d.month} ${d.year}` : d.month);
        revenueData = filteredData.map(d => d.net_revenue);
        spendData = filteredData.map(d => d.spent);
    }

    this.chartData = {
      labels: labels,
      datasets: [
        { data: revenueData, label: 'Net Revenue', backgroundColor: 'rgba(75, 192, 192, 0.6)', borderColor: 'rgb(75, 192, 192)' },
        { data: spendData, label: 'Spend', backgroundColor: 'rgba(255, 99, 132, 0.6)', borderColor: 'rgb(255, 99, 132)' }
      ]
    };
    
    if (this.chartType === 'pie' || this.chartType === 'doughnut') {
         this.chartData.datasets = [{ 
             data: revenueData, 
             label: 'Net Revenue',
             backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40']
         }];
    }
  }

  generateAiSummary() {
      this.isLoadingSummary = true;
      this.dashboardService.getAiSummary(this.selectedYearForChart === 'All' ? '' : this.selectedYearForChart)
        .subscribe({
            next: (res) => {
                this.aiSummary = res.summary;
                this.isLoadingSummary = false;
            },
            error: (err) => {
                console.error('Summary failed', err);
                this.aiSummary = 'Failed to generate summary. Please try again.';
                this.isLoadingSummary = false;
            }
        });
  }

  // Use backend provided calculations
  getDifference(item: any) {
    return item.revenue - item.return;
  }

  getPercentage(item: any) {
    return item.percentage * 100;
  }
  
  getAbs(val: number) {
      return Math.abs(val);
  }

  getMonthWithYear(item: any) {
    // Expected d.year format: "F.Y. 2023-24" or "2023-2024"
    const fyStr = item.year || '';
    const month = item.month || '';
    
    // Extract the first 4-digit year pattern starting with 20
    const yearMatch = fyStr.match(/20(\d{2})/); 
    if (!yearMatch) return month; // Fallback if no year found
    
    let yearPart = parseInt(yearMatch[1], 10); // e.g. 23 from 2023
    
    // Months that typically fall in the next calendar year for an Apr-Mar cycle
    const nextYearMonths = ['Jan', 'Feb', 'Mar'];
    
    // If we ever support extended periods (e.g. Apr 24), we'd need smarter logic.
    // For now, assuming standard FY partition.
    if (nextYearMonths.some(m => month.startsWith(m))) {
        yearPart += 1;
    }
    
    // Format: "Apr, 23"
    return `${month}, ${yearPart}`;
  }
}
