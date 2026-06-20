import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaxService, TaxIntelligence } from '../../services/tax.service';
import { InrCurrencyPipe } from '../../pipes/pipes';
import { SpinnerComponent } from '../shared/spinner/spinner.component';
import { EmptyStateComponent } from '../shared/empty-state/empty-state.component';

@Component({
  selector: 'app-tax-planner',
  standalone: true,
  imports: [CommonModule, InrCurrencyPipe, SpinnerComponent, EmptyStateComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div class="header-text">
          <h1 class="page-title-compact">Tax Intelligence</h1>
          <p class="page-subtitle">Maximize your 80C & 80D insurance deductions</p>
        </div>
      </div>

      <app-spinner *ngIf="loading" message="Analyzing tax benefits..."></app-spinner>

      <div *ngIf="!loading && taxData" class="fade-in">
        <!-- Summary Cards -->
        <div class="stats-summary-grid-compact mb-xl">
          <div class="stat-card-mini glass-card">
            <div class="stat-icon-sm active"><span class="material-icons-round">savings</span></div>
            <div class="stat-info">
              <span class="stat-label">Total 80C</span>
              <h2 class="stat-value-sm">{{ taxData.total80CDeduction | inrCurrency }}</h2>
            </div>
            <div class="stat-footer-alt" *ngIf="taxData.remaining80CLimit > 0">
               Gap: {{ taxData.remaining80CLimit | inrCurrency }}
            </div>
          </div>

          <div class="stat-card-mini glass-card">
            <div class="stat-icon-sm premium"><span class="material-icons-round">health_and_safety</span></div>
            <div class="stat-info">
              <span class="stat-label">Total 80D</span>
              <h2 class="stat-value-sm">{{ taxData.total80DDeduction | inrCurrency }}</h2>
            </div>
            <div class="stat-footer-alt" *ngIf="taxData.remaining80DLimit > 0">
               Gap: {{ taxData.remaining80DLimit | inrCurrency }}
            </div>
          </div>
        </div>

        <div class="dashboard-grid">
          <!-- Breakdown Section -->
          <div class="list-section glass-card">
            <h3 class="section-title mb-md">
              <span class="material-icons-round mr-sm">receipt_long</span>
              Deduction Breakdown
            </h3>
            
            <div class="scroll-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Section</th>
                    <th>Category</th>
                    <th>Holder</th>
                    <th class="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let item of taxData.deductions">
                    <td><span class="badge" [class.badge-active]="item.section === '80C'" [class.badge-pending]="item.section === '80D'">{{ item.section }}</span></td>
                    <td>{{ item.category }}</td>
                    <td>{{ item.holderName }}</td>
                    <td class="text-right fw-600">{{ item.amount | inrCurrency }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <app-empty-state *ngIf="taxData?.deductions?.length === 0" 
                             icon="content_paste_off" 
                             title="No deductions found"
                             description="Add Life or Health insurance policies to see tax benefits.">
            </app-empty-state>
          </div>

          <!-- Opportunities Section -->
          <div class="opportunities-section">
            <h3 class="section-title mb-md">
              <span class="material-icons-round mr-sm">lightbulb</span>
              Savings Opportunities
            </h3>

            <div class="opportunity-card glass-card mb-md" *ngFor="let op of taxData.opportunities">
              <div class="op-header">
                <span class="op-section">{{ op.section }}</span>
                <span class="op-savings">Save up to {{ op.potentialSavings | inrCurrency }}</span>
              </div>
              <h4 class="op-title">{{ op.title }}</h4>
              <p class="op-desc">{{ op.description }}</p>
              <button class="btn btn-secondary btn-sm mt-md">Learn More</button>
            </div>

            <app-empty-state *ngIf="taxData?.opportunities?.length === 0"
                             icon="task_alt"
                             title="Tax Efficient Portfolio"
                             description="Great job! You have maximized your insurance tax benefits.">
            </app-empty-state>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .mr-sm { margin-right: 8px; }
    .mb-xl { margin-bottom: 2rem; }
    .mb-md { margin-bottom: 1rem; }
    .mt-md { margin-top: 1rem; }
    .text-right { text-align: right; }
    .fw-600 { font-weight: 600; }

    .page-title-compact {
      font-size: 1.75rem;
      font-weight: 800;
      color: #fff;
      letter-spacing: -0.02em;
      margin-bottom: 4px;
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: 1.6fr 1fr;
      gap: 1.5rem;
    }

    .section-title {
      display: flex;
      align-items: center;
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text-main);
      opacity: 0.9;
    }

    .opportunity-card {
      padding: 1.5rem;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-left: 4px solid var(--action-primary);
      border-radius: 20px;
      backdrop-filter: blur(10px);
      transition: all 0.3s ease;
      margin-bottom: 1.5rem;
    }

    .opportunity-card:hover {
      transform: translateX(8px);
      background: rgba(255, 255, 255, 0.04);
      border-color: rgba(255, 255, 255, 0.12);
    }

    .op-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .op-section {
      font-size: 0.8rem;
      font-weight: 800;
      color: var(--action-primary);
      text-transform: uppercase;
      letter-spacing: 2px;
    }

    .op-savings {
      font-size: 0.8rem;
      font-weight: 700;
      color: #10b981;
      background: rgba(16, 185, 129, 0.1);
      padding: 4px 12px;
      border-radius: 10px;
      border: 1px solid rgba(16, 185, 129, 0.2);
    }

    .op-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: #fff;
      margin-bottom: 8px;
    }

    .op-desc {
      font-size: 0.95rem;
      color: #94a3b8;
      line-height: 1.6;
    }

    .stat-footer-alt {
      margin-left: auto;
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--status-warning);
      background: rgba(245, 158, 11, 0.1);
      padding: 2px 8px;
      border-radius: 6px;
    }

    .data-table thead th {
      position: sticky;
      top: 0;
      background: #0f172a;
      z-index: 10;
      border-bottom: 2px solid rgba(255,255,255,0.05);
    }

    .scroll-container {
      max-height: 500px;
      overflow-y: auto;
    }

    @media (max-width: 1024px) {
      .dashboard-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class TaxPlannerComponent implements OnInit {
  taxData: TaxIntelligence | null = null;
  loading = true;
  Math = Math;

  constructor(private taxService: TaxService) {}

  ngOnInit(): void {
    this.loadTaxData();
  }

  loadTaxData(): void {
    this.loading = true;
    this.taxService.getTaxPlanning().subscribe({
      next: (res) => {
        if (res && res.data) {
          this.taxData = res.data;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading tax planning:', err);
        this.loading = false;
      }
    });
  }
}
