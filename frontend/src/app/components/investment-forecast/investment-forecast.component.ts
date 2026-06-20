import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { InvestmentForecastService } from '../../services/investment-forecast.service';
import { FamilyMemberService } from '../../services/family-member.service';
import { ToastService } from '../../services/toast.service';
import { InvestmentForecast, MonthlyForecastDetail, MemberForecastSummary, PolicyInstallmentDetail, ApiResponse } from '../../models/models';
import { InrCurrencyPipe } from '../../pipes/pipes';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-investment-forecast',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, InrCurrencyPipe],
  template: `
    <div class="page-container animate__animated animate__fadeIn">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title-compact">
            <span class="material-icons-round text-gradient" style="vertical-align:middle;margin-right:8px;font-size:1.75rem !important">trending_up</span>
            Investment Forecast
          </h1>
          <p class="page-subtitle">Premium outflow & maturity income projection — Indian FY</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-outline fy-nav" (click)="prevFY()">
            <span class="material-icons-round">chevron_left</span>
          </button>
          <span class="fy-label">FY {{ fyYear }}-{{ (fyYear + 1) % 100 | number:'2.0-0' }}</span>
          <button class="btn btn-outline fy-nav" (click)="nextFY()">
            <span class="material-icons-round">chevron_right</span>
          </button>
          <button class="btn btn-secondary" (click)="exportCsv()">
            <span class="material-icons-round">download</span> Export
          </button>
        </div>
      </div>

      <!-- Member Filter -->
      <div class="member-filter glass-card mb-lg">
        <span class="filter-label">
          <span class="material-icons-round">filter_list</span> Family Members
        </span>
        <div class="member-chips">
          <button class="chip" [class.active]="allSelected" (click)="toggleAll()">All</button>
          <button class="chip" *ngFor="let m of memberNames"
                  [class.active]="selectedMembers.includes(m)"
                  (click)="toggleMember(m)">
            {{ m }}
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div class="loading-overlay" *ngIf="loading">
        <div class="spinner"></div>
        <p>Projecting installments...</p>
      </div>

      <div *ngIf="!loading && forecast">
        <!-- KPI Cards -->
        <div class="stats-summary-grid-compact mb-lg">
          <div class="stat-card-mini glass-card">
            <div class="stat-icon-sm" style="background: rgba(239,68,68,0.15); color: #ef4444;">
              <span class="material-icons-round">payments</span>
            </div>
            <div class="stat-info">
              <span class="stat-label">Total Outflow</span>
              <h3 class="stat-value-sm">{{ forecast.totalYearlyOutflow | inrCurrency }}</h3>
            </div>
          </div>
          <div class="stat-card-mini glass-card">
            <div class="stat-icon-sm" style="background: rgba(16,185,129,0.15); color: #10b981;">
              <span class="material-icons-round">savings</span>
            </div>
            <div class="stat-info">
              <span class="stat-label">Maturity Income</span>
              <h3 class="stat-value-sm">{{ forecast.totalExpectedMaturity | inrCurrency }}</h3>
            </div>
          </div>
          <div class="stat-card-mini glass-card">
            <div class="stat-icon-sm" [style.background]="forecast.netPosition >= 0 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'" 
                 [style.color]="forecast.netPosition >= 0 ? '#10b981' : '#ef4444'">
              <span class="material-icons-round">{{ forecast.netPosition >= 0 ? 'arrow_upward' : 'arrow_downward' }}</span>
            </div>
            <div class="stat-info">
              <span class="stat-label">Net Position</span>
              <h3 class="stat-value-sm" [style.color]="forecast.netPosition >= 0 ? '#10b981' : '#ef4444'">
                {{ forecast.netPosition | inrCurrency }}
              </h3>
            </div>
          </div>
          <div class="stat-card-mini glass-card" style="min-width: 180px;">
            <div class="stat-icon-sm" style="background: rgba(99,102,241,0.15); color: #818cf8;">
              <span class="material-icons-round">description</span>
            </div>
            <div class="stat-info">
              <span class="stat-label">Active Assets</span>
              <h3 class="stat-value-sm">
                {{ forecast.totalPolicies }} <span style="font-size:0.75rem;color:#94a3b8">Pol</span> / 
                {{ forecast.totalMutualFunds || 0 }} <span style="font-size:0.75rem;color:#94a3b8">MF</span>
              </h3>
            </div>
          </div>
        </div>

        <!-- Monthly Chart -->
        <div class="glass-card chart-section mb-lg">
          <h4 class="section-title">
            <span class="material-icons-round">bar_chart</span>
            Monthly Premium Outflow vs Maturity Income
          </h4>
          <div class="canvas-wrapper">
            <canvas #forecastChart></canvas>
          </div>
        </div>

        <!-- Monthly Breakdown Table -->
        <div class="glass-card mb-lg">
          <h4 class="section-title">
            <span class="material-icons-round">calendar_month</span>
            Monthly Installment Breakdown
          </h4>
          <div class="monthly-grid">
            <div *ngFor="let month of forecast.monthlyBreakdown" 
                 class="month-card" [class.has-items]="month.installments.length > 0"
                 [class.expanded]="expandedMonth === month.month"
                 (click)="toggleMonth(month.month)">
              <div class="month-header">
                <span class="month-name">{{ month.month }}</span>
                <div class="month-stats">
                  <span class="outflow-badge" *ngIf="month.totalOutflow > 0">
                    ▼ {{ month.totalOutflow | inrCurrency }}
                  </span>
                  <span class="maturity-badge" *ngIf="month.totalMaturityIncome > 0">
                    ▲ {{ month.totalMaturityIncome | inrCurrency }}
                  </span>
                  <span class="count-badge">{{ month.installments.length }}</span>
                </div>
              </div>
              <div class="month-details" *ngIf="expandedMonth === month.month && month.installments.length > 0">
                <div *ngFor="let inst of month.installments" class="installment-row"
                     [class.paid]="inst.isPaid" [class.overdue]="inst.status === 'Overdue'">
                  <div class="inst-left">
                    <span class="inst-policy">{{ inst.policyNumber }}</span>
                    <span class="inst-meta">{{ inst.memberName }} · {{ inst.policyTypeName }}</span>
                  </div>
                  <div class="inst-right">
                    <span class="inst-amount">{{ inst.amount | inrCurrency }}</span>
                    <span class="inst-status" [ngClass]="'status-' + inst.status.toLowerCase()">{{ inst.status }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Member-wise Summary -->
        <div class="glass-card" *ngIf="forecast.memberWiseSummary.length > 0">
          <h4 class="section-title">
            <span class="material-icons-round">group</span>
            Member-wise Investment Summary
          </h4>
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Family Member</th>
                  <th>Relationship</th>
                  <th class="text-center">Policies</th>
                  <th class="text-center">Mutual Funds</th>
                  <th class="text-end">Yearly Outflow</th>
                  <th class="text-end">Yearly Maturity</th>
                  <th class="text-end">Net</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let m of forecast.memberWiseSummary">
                  <td class="fw-700 text-white">{{ m.memberName }}</td>
                  <td>{{ m.relationship }}</td>
                  <td class="text-center">
                    <a [routerLink]="['/policies']" [queryParams]="{ familyMemberId: m.memberId }" class="policy-count-link">
                      {{ m.policyCount }}
                    </a>
                  </td>
                  <td class="text-center">
                    <span class="policy-count-link" style="background: rgba(16, 185, 129, 0.15); color: #10b981;">
                      {{ m.mutualFundCount || 0 }}
                    </span>
                  </td>
                  <td class="text-end text-danger">{{ m.yearlyOutflow | inrCurrency }}</td>
                  <td class="text-end text-success">{{ m.yearlyMaturity | inrCurrency }}</td>
                  <td class="text-end" [class.text-success]="m.yearlyMaturity - m.yearlyOutflow >= 0"
                      [class.text-danger]="m.yearlyMaturity - m.yearlyOutflow < 0">
                    {{ (m.yearlyMaturity - m.yearlyOutflow) | inrCurrency }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .text-gradient {
      background: linear-gradient(135deg, #6366f1, #06b6d4);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      font-size: 32px !important;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .fy-nav {
      padding: 8px !important;
      min-width: unset;
    }
    .fy-label {
      font-size: 1.1rem;
      font-weight: 800;
      color: #fff;
      min-width: 120px;
      text-align: center;
    }
    .member-filter {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px 20px;
      flex-wrap: wrap;
    }
    .filter-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.85rem;
      font-weight: 600;
      color: #94a3b8;
      white-space: nowrap;
    }
    .member-chips {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .chip {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      color: #94a3b8;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .chip:hover { border-color: rgba(99,102,241,0.4); color: #e2e8f0; }
    .chip.active {
      background: rgba(99,102,241,0.2);
      border-color: #818cf8;
      color: #818cf8;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.5rem;
    }
    .stat-card {
      padding: 1.5rem;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 20px;
      display: flex;
      align-items: center;
      gap: 1.25rem;
      transition: all 0.3s;
    }
    .stat-card:hover { transform: translateY(-3px); background: rgba(255,255,255,0.05); }
    .stat-icon {
      width: 52px; height: 52px; border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
    }
    .stat-icon span { font-size: 26px; }
    .stat-info h3 { font-size: 1.5rem; margin: 0; color: #fff; }
    .stat-info p { margin: 0; color: #718096; font-size: 0.8rem; font-weight: 500; }

    .chart-section { padding: 2rem; }
    .canvas-wrapper { position: relative; height: 300px; width: 100%; }

    .section-title {
      display: flex;
      align-items: center;
      gap: 10px;
      color: #e2e8f0;
      font-size: 1rem;
      font-weight: 700;
      margin: 0 0 1.5rem 0;
      padding: 1.5rem 1.5rem 0;
    }

    .monthly-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 12px;
      padding: 0 1.5rem 1.5rem;
    }
    .month-card {
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 14px;
      padding: 14px 16px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .month-card:hover { border-color: rgba(99,102,241,0.3); }
    .month-card.has-items { border-color: rgba(99,102,241,0.15); }
    .month-card.expanded { background: rgba(99,102,241,0.05); border-color: #818cf8; }
    .month-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .month-name { font-weight: 700; color: #e2e8f0; font-size: 0.9rem; }
    .month-stats { display: flex; gap: 8px; align-items: center; }
    .outflow-badge {
      font-size: 0.7rem; font-weight: 700; color: #ef4444;
      background: rgba(239,68,68,0.1); padding: 2px 8px; border-radius: 6px;
    }
    .maturity-badge {
      font-size: 0.7rem; font-weight: 700; color: #10b981;
      background: rgba(16,185,129,0.1); padding: 2px 8px; border-radius: 6px;
    }
    .count-badge {
      width: 22px; height: 22px; border-radius: 6px;
      background: rgba(99,102,241,0.15); color: #818cf8;
      font-size: 0.7rem; font-weight: 800;
      display: flex; align-items: center; justify-content: center;
    }
    .month-details { margin-top: 12px; }
    .installment-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-top: 1px solid rgba(255,255,255,0.04);
    }
    .installment-row.paid { opacity: 0.5; }
    .installment-row.overdue .inst-amount { color: #ef4444; }
    .inst-policy { font-size: 0.8rem; font-weight: 700; color: #818cf8; }
    .inst-meta { font-size: 0.7rem; color: #64748b; display: block; }
    .inst-amount { font-size: 0.85rem; font-weight: 700; color: #e2e8f0; }
    .inst-status {
      font-size: 0.6rem; font-weight: 800; text-transform: uppercase;
      padding: 2px 6px; border-radius: 4px; margin-left: 6px;
    }
    .status-upcoming { background: rgba(99,102,241,0.1); color: #818cf8; }
    .status-paid { background: rgba(16,185,129,0.1); color: #10b981; }
    .status-overdue { background: rgba(239,68,68,0.1); color: #ef4444; }

    .policy-count-link {
      display: inline-block;
      background: rgba(99, 102, 241, 0.15);
      color: #818cf8;
      padding: 4px 12px;
      border-radius: 12px;
      font-weight: 700;
      text-decoration: none;
      transition: all 0.2s ease;
      cursor: pointer;
    }

    .policy-count-link:hover {
      background: rgba(99, 102, 241, 0.3);
      color: #fff;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
    }

    .data-table thead th {
      position: sticky;
      top: 0;
      background: #0f172a;
      z-index: 10;
      border-bottom: 2px solid rgba(255,255,255,0.05);
    }

    .table-responsive {
      max-height: 400px;
      overflow-y: auto;
    }

    .text-danger { color: #ef4444 !important; }
    .text-success { color: #10b981 !important; }
  `]
})
export class InvestmentForecastComponent implements OnInit, AfterViewInit {
  @ViewChild('forecastChart') chartRef!: ElementRef<HTMLCanvasElement>;

  forecast: InvestmentForecast | null = null;
  loading = true;
  fyYear = 0;
  expandedMonth: string | null = null;
  memberNames: string[] = [];
  selectedMembers: string[] = [];
  private chart?: Chart<'bar', number[], string>;

  constructor(
    private forecastService: InvestmentForecastService,
    private familyMemberService: FamilyMemberService,
    private toast: ToastService
  ) {
    // Calculate current Indian FY start year
    const today = new Date();
    this.fyYear = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
  }

  ngOnInit(): void {
    this.familyMemberService.getAll().subscribe({
      next: (res: any) => {
        this.memberNames = res.data?.map((m: any) => m.name) ?? [];
        this.loadForecast();
      },
      error: () => this.loadForecast()
    });
  }

  ngAfterViewInit(): void {
    // Chart is built after data loads
  }

  get allSelected(): boolean { return this.selectedMembers.length === 0; }
  set allSelected(_: boolean) {}

  toggleAll(): void {
    this.selectedMembers = [];
    this.loadForecast();
  }

  toggleMember(name: string): void {
    const idx = this.selectedMembers.indexOf(name);
    if (idx >= 0) {
      this.selectedMembers.splice(idx, 1);
    } else {
      this.selectedMembers.push(name);
    }
    this.loadForecast();
  }

  prevFY(): void {
    this.fyYear--;
    this.loadForecast();
  }

  nextFY(): void {
    this.fyYear++;
    this.loadForecast();
  }

  toggleMonth(month: string): void {
    this.expandedMonth = this.expandedMonth === month ? null : month;
  }

  loadForecast(): void {
    this.loading = true;
    this.forecastService.getForecast(this.fyYear, this.selectedMembers).subscribe({
      next: (res: ApiResponse<InvestmentForecast>) => {
        this.forecast = res.data ?? null;
        this.loading = false;
        setTimeout(() => this.buildChart(), 100);
      },
      error: () => {
        this.loading = false;
        this.toast.error('Failed to load investment forecast');
      }
    });
  }

  private buildChart(): void {
    if (!this.chartRef || !this.forecast) return;
    const ctx = this.chartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.chart) this.chart.destroy();

    const months = this.forecast.monthlyBreakdown.map((m: MonthlyForecastDetail) => m.month);
    const outflows = this.forecast.monthlyBreakdown.map((m: MonthlyForecastDetail) => m.totalOutflow);
    const maturities = this.forecast.monthlyBreakdown.map((m: MonthlyForecastDetail) => m.totalMaturityIncome);

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [
          {
            label: 'Premium / SIP Outflow (₹)',
            data: outflows,
            backgroundColor: 'rgba(239, 68, 68, 0.5)',
            borderColor: '#ef4444',
            borderWidth: 2,
            borderRadius: 6,
            hoverBackgroundColor: 'rgba(239, 68, 68, 0.8)'
          },
          {
            label: 'Maturity / Redemption Income (₹)',
            data: maturities,
            backgroundColor: 'rgba(16, 185, 129, 0.5)',
            borderColor: '#10b981',
            borderWidth: 2,
            borderRadius: 6,
            hoverBackgroundColor: 'rgba(16, 185, 129, 0.8)'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { color: '#94a3b8', font: { size: 12 }, usePointStyle: true }
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            titleColor: '#fff',
            bodyColor: '#fff',
            padding: 14,
            cornerRadius: 10,
            callbacks: {
              label: (ctx: any) => {
                const val = ctx.parsed.y;
                return val ? ` ₹${val.toLocaleString('en-IN')}` : '';
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#94a3b8', font: { size: 11 } }
          },
          x: {
            grid: { display: false },
            ticks: { color: '#94a3b8', font: { size: 11 } }
          }
        }
      } as any
    });
  }

  exportCsv(): void {
    if (!this.forecast) return;
    const headers = ['Month', 'Policy', 'Member', 'Type', 'Amount', 'Due Date', 'Status'];
    const rows: string[][] = [];
    for (const month of this.forecast.monthlyBreakdown) {
      for (const inst of month.installments) {
        rows.push([
          month.month, inst.policyNumber, inst.memberName, inst.policyTypeName,
          inst.amount.toString(), new Date(inst.dueDate).toLocaleDateString('en-IN'), inst.status
        ]);
      }
    }
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Investment_Forecast_FY${this.fyYear}-${(this.fyYear + 1) % 100}.csv`;
    link.click();
  }
}
