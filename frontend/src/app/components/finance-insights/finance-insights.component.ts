import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FinanceService, IrrAnalysisDto } from '../../services/finance.service';
import { SpinnerComponent } from '../shared/spinner/spinner.component';
import { EmptyStateComponent } from '../shared/empty-state/empty-state.component';

@Component({
  selector: 'app-finance-insights',
  standalone: true,
  imports: [CommonModule, SpinnerComponent, EmptyStateComponent],
  template: `
    <div class="page-container">
      <header class="page-header">
        <div>
          <h1 class="page-title-compact">Portfolio Yield (ICC)</h1>
          <p class="page-subtitle">Internal Rate of Return (IRR) & Portfolio Yield Analysis</p>
        </div>
      </header>

      <div *ngIf="loading" class="loading-state">
        <app-spinner message="Calculating portfolio performance..."></app-spinner>
      </div>

      <div *ngIf="!loading && irrData.length === 0">
        <app-empty-state 
          title="No Financial Data" 
          message="Record payments for your policies to see IRR analysis."
          icon="payments">
        </app-empty-state>
      </div>

      <div *ngIf="!loading && irrData.length > 0" class="insights-grid">
        <!-- Average Portfolio IRR Card -->
        <div class="stat-card-mini glass-card hero-card" style="padding: 1.5rem; border-radius: 24px;">
          <div class="stat-icon-sm" style="background: rgba(255,255,255,0.2); color: #fff; width: 48px; height: 48px;">
            <span class="material-icons-round" style="font-size: 24px;">insights</span>
          </div>
          <div class="stat-info">
            <span class="stat-label" style="color: rgba(255,255,255,0.8)">Weighted Portfolio IRR</span>
            <h3 class="stat-value-sm" style="font-size: 1.75rem; color: #fff;">{{ avgIrr | number:'1.2-2' }}%</h3>
          </div>
          <div class="stat-tag" style="margin-left: auto; color: rgba(255,255,255,0.9); font-weight: 700; font-size: 0.8rem;">
             {{ avgIrr > 7 ? 'Beating FD' : 'Market Standard' }}
          </div>
        </div>

        <!-- IRR vs Benchmark Table -->
        <div class="data-card full-width">
          <div class="card-header">
            <h3 class="card-title">Policy Yield vs Market Benchmarks</h3>
          </div>
          <div class="table-container custom-scrollbar">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Policy</th>
                  <th>Total Invested</th>
                  <th>Expected Return</th>
                  <th>IRR (%)</th>
                  <th>Benchmarking</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of irrData">
                  <td>
                    <div class="policy-info">
                      <span class="policy-num">{{ item.policyNumber }}</span>
                    </div>
                  </td>
                  <td>{{ item.totalInvested | currency:'INR' }}</td>
                  <td>{{ item.totalExpectedReturn | currency:'INR' }}</td>
                  <td>
                    <div class="irr-badge" [style.background]="getIrrColor(item.irrPercentage)">
                      {{ item.irrPercentage }}%
                    </div>
                  </td>
                  <td>
                    <div class="benchmark-bar">
                      <div class="bar-label">vs FD (7%)</div>
                      <div class="progress-wrap">
                        <div class="progress-fill" [style.width.%]="(item.irrPercentage / 15) * 100" [class.beat]="item.irrPercentage > 7"></div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="rec-pill" [class.high]="item.irrPercentage > 8" [class.mid]="item.irrPercentage >= 6 && item.irrPercentage <= 8" [class.low]="item.irrPercentage < 6">
                      {{ item.recommendation }}
                    </span>
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
    .insights-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
      animation: fadeIn 0.5s ease-out;
    }

    .full-width { grid-column: 1 / -1; }

    .hero-card {
      background: linear-gradient(135deg, var(--action-primary), #4f46e5);
      color: white;
    }

    .hero-card .label { color: rgba(255, 255, 255, 0.8); }
    .hero-card .value { color: white; font-size: 2.5rem; }
    .hero-card .desc { color: rgba(255, 255, 255, 0.7); }

    .irr-badge {
      padding: 4px 10px;
      border-radius: 8px;
      font-weight: 800;
      font-size: 0.85rem;
      display: inline-block;
      color: white;
      box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    }

    .benchmark-bar {
      width: 150px;
    }

    .bar-label { font-size: 0.7rem; color: var(--text-muted); margin-bottom: 4px; }

    .progress-wrap {
      height: 6px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 3px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: var(--text-muted);
      border-radius: 3px;
      transition: width 1s ease-in-out;
    }

    .progress-fill.beat {
      background: var(--status-success);
    }

    .rec-pill {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 4px 12px;
      border-radius: 20px;
    }

    .rec-pill.high { background: rgba(34, 197, 94, 0.1); color: #22c55e; border: 1px solid rgba(34, 197, 94, 0.2); }
    .rec-pill.mid { background: rgba(234, 179, 8, 0.1); color: #eab308; border: 1px solid rgba(234, 179, 8, 0.2); }
    .rec-pill.low { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); }

    .policy-info { font-weight: 600; }

    .data-table thead th {
      position: sticky;
      top: 0;
      background: #0f172a;
      z-index: 10;
      border-bottom: 2px solid rgba(255,255,255,0.05);
    }

    .table-container {
      max-height: 500px;
      overflow-y: auto;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class FinanceInsightsComponent implements OnInit {
  irrData: IrrAnalysisDto[] = [];
  loading = true;
  avgIrr = 0;
  Math = Math;

  constructor(private financeService: FinanceService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.financeService.getPortfolioIrr().subscribe({
      next: (res) => {
        this.irrData = res?.data || [];
        if (this.irrData && this.irrData.length > 0) {
          const sum = this.irrData.reduce((a, b) => a + (b.irrPercentage || 0), 0);
          this.avgIrr = sum / this.irrData.length;
        } else {
          this.avgIrr = 0;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading portfolio yield:', err);
        this.loading = false;
      }
    });
  }

  getIrrColor(irr: number): string {
    if (irr > 10) return '#10b981'; // Success Green
    if (irr > 7) return '#3b82f6';  // Action Blue
    if (irr > 5) return '#f59e0b';  // Warning Amber
    return '#ef4444';               // Danger Red
  }
}
