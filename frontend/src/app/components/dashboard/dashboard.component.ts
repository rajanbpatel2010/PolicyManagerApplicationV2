import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DashboardService } from '../../services/policy.service';
import { DashboardStats, PolicyForecast } from '../../models/models';
import { InrCurrencyPipe, TimeAgoPipe } from '../../pipes/pipes';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ToastService } from '../../services/toast.service';
import { MemberSelectorComponent } from './member-selector/member-selector.component';
import { ForecastListComponent } from './forecast-list/forecast-list.component';
import { ForecastChartComponent } from './forecast-chart/forecast-chart.component';
import { SpinnerComponent } from '../shared/spinner/spinner.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, InrCurrencyPipe, TimeAgoPipe, DragDropModule, MemberSelectorComponent, ForecastListComponent, ForecastChartComponent, SpinnerComponent],
  template: `
    <div class="dashboard-root">
      <!-- Background Decorative Elements -->
      <div class="glow-bg glow-1"></div>
      <div class="glow-bg glow-2"></div>

      <div class="page-container">
        <!-- Professional Header -->
        <div class="page-header-refined fade-in">
          <div class="header-main">
            <div class="header-titles">
              <h1 class="dashboard-title-compact">Family Wealth Dashboard</h1>
              <p class="dashboard-subtitle-compact">Financial stewardship for your legacy</p>
            </div>
            
            <!-- Compact Member Selector -->
            <div class="member-selector-compact">
              <app-member-selector (selectionChange)="onMembersChanged($event)"></app-member-selector>
            </div>
          </div>
        </div>

        <!-- Loading state -->
        <app-spinner *ngIf="loading" 
                     [overlay]="true" 
                     message="Synthesizing portfolio intelligence...">
        </app-spinner>

        <div *ngIf="!loading && stats" class="dashboard-content fade-in">
          <!-- Premium Stats Grid -->
          <div class="premium-grid mb-xl">
            <!-- Current Month -->
            <div class="stat-card-premium current" 
                 (click)="selectCurrentMonth()" 
                 [class.active]="isCurrentMonthSelected()"
                 role="button">
              <div class="stat-icon-wrap">
                <span class="material-icons-round">account_balance</span>
              </div>
              <div class="stat-body">
                <span class="stat-hint">Current Month</span>
                <h2 class="stat-price">{{ stats.currentMonthBudget | inrCurrency }}</h2>
                <div class="stat-tag">Running Budget</div>
              </div>
              <div class="active-indicator" *ngIf="isCurrentMonthSelected()"></div>
            </div>

            <!-- Next Month -->
            <div class="stat-card-premium next" 
                 (click)="selectNextMonth()" 
                 [class.active]="isNextMonthSelected()"
                 role="button">
              <div class="stat-icon-wrap">
                <span class="material-icons-round">calendar_today</span>
              </div>
              <div class="stat-body">
                <span class="stat-hint">Next Month</span>
                <h2 class="stat-price">{{ stats.nextMonthBudget | inrCurrency }}</h2>
                <div class="stat-tag">Scheduled Outflow</div>
              </div>
              <div class="active-indicator" *ngIf="isNextMonthSelected()"></div>
            </div>

            <!-- Annual Outflow -->
            <div class="stat-card-premium annual" 
                 (click)="selectAllForecasts()" 
                 [class.active]="!selectedMonth"
                 role="button">
              <div class="stat-icon-wrap">
                <span class="material-icons-round">analytics</span>
              </div>
              <div class="stat-body">
                <span class="stat-hint">Annual Outflow</span>
                <h2 class="stat-price">{{ stats.currentFYBudget | inrCurrency }}</h2>
                <div class="stat-tag">FY 2026-27 Projection</div>
              </div>
              <div class="active-indicator" *ngIf="!selectedMonth"></div>
            </div>

            <!-- One Time Investments -->
            <div class="stat-card-premium investment" routerLink="/one-time-investments">
              <div class="stat-icon-wrap">
                <span class="material-icons-round">savings</span>
              </div>
              <div class="stat-body">
                <span class="stat-hint">One Time Assets</span>
                <h2 class="stat-price">{{ stats.oneTimeInvestmentTotal | inrCurrency }}</h2>
                <div class="stat-tag">{{ stats.oneTimeInvestmentCount }} Active Assets</div>
              </div>
              <span class="material-icons-round card-arrow">chevron_right</span>
            </div>

            <!-- Pending Upcoming Premiums -->
            <div class="stat-card-premium upcoming" routerLink="/policies" [queryParams]="{installmentFilter: 'upcoming'}">
              <div class="stat-icon-wrap">
                <span class="material-icons-round">pending_actions</span>
              </div>
              <div class="stat-body">
                <span class="stat-hint">Upcoming Premium (FY)</span>
                <h2 class="stat-price">{{ stats.upcomingPremiumAmount | inrCurrency }}</h2>
                <div class="stat-tag">
                  <span class="upcoming-badge">{{ stats.upcomingPremiumCount }} payments due till FY End</span>
                </div>
              </div>
              <span class="material-icons-round card-arrow">chevron_right</span>
            </div>
          </div>

          <!-- Intelligence Grid -->
          <div class="intelligence-grid">
            <div class="chart-box glass-box">
              <div class="box-header">
                <h3 class="box-title"><span class="material-icons-round">insights</span>Cash Flow Projection</h3>
              </div>
              <app-forecast-chart [forecasts]="stats.monthlyForecasts" (monthSelected)="onMonthSelected($event)"></app-forecast-chart>
            </div>
            
            <div class="list-box glass-box">
              <div class="box-header">
                <h3 class="box-title"><span class="material-icons-round">receipt_long</span>Forecast Details</h3>
                <span class="status-chip" *ngIf="selectedMonth">{{ selectedMonth }}</span>
              </div>
              <app-forecast-list [forecasts]="filteredForecasts" [selectedMonth]="selectedMonth"></app-forecast-list>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-root {
      position: relative;
      min-height: 100vh;
      overflow-x: hidden;
      padding-bottom: 5rem;
      background: radial-gradient(circle at 50% 0%, rgba(30, 41, 59, 0.5) 0%, transparent 70%);
    }

    .glow-bg {
      position: fixed;
      width: 800px;
      height: 800px;
      border-radius: 50%;
      filter: blur(150px);
      z-index: -1;
      opacity: 0.12;
      pointer-events: none;
    }
    .glow-1 { top: -200px; right: -200px; background: radial-gradient(circle, #6366f1, transparent); }
    .glow-2 { bottom: -200px; left: -200px; background: radial-gradient(circle, #f43f5e, transparent); }

    .page-container {
      max-width: 1600px;
      margin: 0 auto;
      padding: 1rem;
    }

    /* ── Refined Header ── */
    .page-header-refined {
      margin-bottom: 1.5rem;
    }
    .header-main {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding-bottom: 1rem;
    }
    .dashboard-title-compact {
      font-size: 1.85rem;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin: 0;
      color: #fff;
      white-space: nowrap;
    }
    .dashboard-subtitle-compact {
      color: #64748b;
      font-size: 1rem;
      font-weight: 500;
      margin-top: 0.25rem;
    }
    .member-selector-compact {
      flex: 1;
      max-width: 800px;
    }

    /* ── Premium Grid ── */
    .premium-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
      gap: 1.5rem;
    }

    .stat-card-premium {
      position: relative;
      padding: 0.5rem 0.5rem;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 16px;
      cursor: pointer;
      transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .stat-card-premium:hover {
      transform: translateY(-8px);
      background: rgba(255, 255, 255, 0.06);
      border-color: rgba(255, 255, 255, 0.15);
      box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.4);
    }

    .stat-card-premium.active {
      border-color: rgba(99, 102, 241, 0.4);
      background: rgba(99, 102, 241, 0.05);
    }

    .stat-icon-wrap {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #94a3b8;
    }
    .stat-icon-wrap span { font-size: 20px; }

    .stat-body { flex: 1; }
    .stat-hint {
      font-size: 0.7rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }
    .stat-price {
      font-size: 1.35rem;
      font-weight: 800;
      color: #fff;
      margin: 1px 0;
      letter-spacing: -0.5px;
    }
    .stat-tag {
      font-size: 0.8rem;
      font-weight: 600;
      color: #64748b;
    }

    .active-indicator {
      position: absolute;
      top: 12px;
      right: 12px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #6366f1;
      box-shadow: 0 0 12px #6366f1;
    }

    .card-arrow {
      color: #475569;
      font-size: 20px;
    }

    /* Colors */
    .current:hover .stat-icon-wrap { color: #10b981; border-color: rgba(16, 185, 129, 0.3); }
    .next:hover .stat-icon-wrap { color: #6366f1; border-color: rgba(99, 102, 241, 0.3); }
    .annual:hover .stat-icon-wrap { color: #f43f5e; border-color: rgba(244, 63, 94, 0.3); }
    .investment:hover .stat-icon-wrap { color: #f59e0b; border-color: rgba(245, 158, 11, 0.3); }
    .upcoming:hover .stat-icon-wrap { color: #fbbf24; border-color: rgba(251, 191, 36, 0.3); }

    .upcoming-badge {
      background: rgba(251, 191, 36, 0.12);
      color: #fbbf24;
      padding: 1px 6px;
      border-radius: 6px;
      font-size: 0.72rem;
      font-weight: 700;
      border: 1px solid rgba(251, 191, 36, 0.2);
    }

    /* ── Intelligence Grid ── */
    .intelligence-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.5rem;
      margin-top: 1.5rem;
      align-items: start;
    }

    .glass-box {
      background: rgba(15, 23, 42, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.04);
      border-radius: 24px;
      backdrop-filter: blur(16px);
      padding: 1.2rem;
    }

    .box-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .box-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .box-title span { color: #64748b; font-size: 22px; }

    .status-chip {
      background: rgba(99, 102, 241, 0.1);
      color: #818cf8;
      padding: 4px 14px;
      border-radius: 100px;
      font-size: 0.85rem;
      font-weight: 700;
      border: 1px solid rgba(99, 102, 241, 0.2);
    }


    @media (max-width: 1024px) {
      .header-main { flex-direction: column; align-items: flex-start; gap: 1.5rem; }
      .member-selector-compact { width: 100%; max-width: none; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  stats: DashboardStats | null = null;
  loading = true;
  selectedMembers: string[] = [];
  selectedMonth: string | null = null;
  filteredForecasts: PolicyForecast[] = [];

  constructor(
    private dashboardService: DashboardService,
    private toast: ToastService
  ) { }

  ngOnInit(): void {
    // Set default selected month to next month (using UTC to match chart labels)
    const now = new Date();
    const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    this.selectedMonth = this.formatMonth(nextMonth, true);

    this.loadStats();
  }

  private formatMonth(date: Date, isUTC: boolean = false): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const m = isUTC ? date.getUTCMonth() : date.getMonth();
    const y = isUTC ? date.getUTCFullYear() : date.getFullYear();
    return `${months[m]} ${y}`;
  }

  onMembersChanged(members: string[]): void {
    this.selectedMembers = members;
    this.loadStats();
  }

  onMonthSelected(month: string | null): void {
    this.selectedMonth = month;
    this.filterForecasts();
  }

  selectCurrentMonth(): void {
    const now = new Date();
    this.selectedMonth = this.formatMonth(now, true);
    this.filterForecasts();
  }

  selectNextMonth(): void {
    const now = new Date();
    const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    this.selectedMonth = this.formatMonth(nextMonth, true);
    this.filterForecasts();
  }

  selectAllForecasts(): void {
    this.selectedMonth = null;
    this.filterForecasts();
  }

  isCurrentMonthSelected(): boolean {
    return this.selectedMonth === this.formatMonth(new Date(), true);
  }

  isNextMonthSelected(): boolean {
    const now = new Date();
    const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    return this.selectedMonth === this.formatMonth(nextMonth, true);
  }

  loadStats(): void {
    this.loading = true;
    this.dashboardService.getStats(this.selectedMembers).subscribe({
      next: (res) => {
        this.stats = res.data;
        this.filterForecasts();
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.toast.error("Failed to load family stats");
      }
    });
  }

  private filterForecasts(): void {
    if (!this.stats) return;

    if (!this.selectedMonth) {
      this.filteredForecasts = [...this.stats.forecastList];
      return;
    }

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    this.filteredForecasts = this.stats.forecastList.filter(f => {
      if (!f.nextInstallmentDate) return false;
      // Stable parsing: "2024-05-16..." -> get month and year from string
      const parts = f.nextInstallmentDate.split('T')[0].split('-');
      const y = parts[0];
      const m = parseInt(parts[1]) - 1;
      const monthLabel = `${months[m]} ${y}`;
      return monthLabel === this.selectedMonth;
    });
  }
}
