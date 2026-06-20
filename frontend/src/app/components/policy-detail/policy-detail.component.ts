import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

import { PolicyService } from '../../services/policy.service';
import { ToastService } from '../../services/toast.service';
import { Policy, AuditLog } from '../../models/models';
import { InrCurrencyPipe, TimeAgoPipe } from '../../pipes/pipes';

@Component({
    selector: 'app-policy-detail',
    standalone: true,
    imports: [CommonModule, RouterLink, InrCurrencyPipe, TimeAgoPipe, FormsModule],
    template: `
    <div class="page-container">
      <div class="loading-overlay" *ngIf="loading">
        <div class="spinner"></div>
        <p>Loading policy details...</p>
      </div>

      <div *ngIf="!loading && policy">
        <!-- Header -->
        <div class="page-header sticky-header">
          <div class="header-left">
            <button class="btn-icon-back" (click)="goBack()">
              <span class="material-icons-round">arrow_back</span>
            </button>
            <div class="header-title-area">
              <h1 class="page-title">{{ policy.policyNumber }}</h1>
              <div class="d-flex align-center gap-sm">
                <span class="badge sm" [class]="'badge-' + policy.status.toLowerCase()">
                  {{ policy.status }}
                </span>
                <span class="page-subtitle">{{ policy.policyTypeName }}</span>
              </div>
            </div>
          </div>
          <div class="header-actions desktop-only">
             <button class="btn btn-secondary btn-icon" (click)="onShare()" title="Share Policy">
                <span class="material-icons-round">share</span>
             </button>
             <button class="btn btn-secondary" (click)="togglePaymentForm()" [disabled]="markingPaid">
                <span class="material-icons-round" *ngIf="!markingPaid">payments</span>
                <span class="spinner sm" *ngIf="markingPaid"></span>
                Pay
             </button>
            <button class="btn btn-secondary" (click)="copyPolicy()" title="Copy Policy">
              <span class="material-icons-round">content_copy</span>
              Copy
            </button>
            <a [routerLink]="['/policies', policy.id, 'edit']" class="btn btn-primary">
              <span class="material-icons-round">edit</span>
              Edit
            </a>
          </div>
        </div>



        <!-- Detail Cards Grid -->
        <div class="detail-grid">
          <!-- Policy Holder Info -->
          <div class="glass-card">
            <h4 class="section-title">
              <span class="material-icons-round">person</span>
              {{ isMutualFund ? 'Investor / Holder' : 'Policy Holder' }}
            </h4>
            <div class="detail-rows">
              <div class="detail-row">
                <span class="detail-label">Name</span>
                <span class="detail-value">{{ policy.policyHolderName }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Email</span>
                <span class="detail-value">{{ policy.email }}</span>
              </div>
              <div class="detail-row" *ngIf="policy.phoneNumber">
                <span class="detail-label">Phone</span>
                <span class="detail-value">{{ policy.phoneNumber }}</span>
              </div>
              <div class="detail-row" *ngIf="policy.familyMemberName">
                <span class="detail-label">Family Member</span>
                <span class="detail-value text-primary">{{ policy.familyMemberName }}</span>
              </div>
              <div class="detail-row" *ngIf="policy.ageAtInception">
                <span class="detail-label">Age at Inception</span>
                <span class="detail-value">{{ policy.ageAtInception }} years</span>
              </div>
            </div>
          </div>

          <!-- Policy Details -->
          <div class="glass-card">
            <h4 class="section-title">
              <span class="material-icons-round">description</span>
              {{ isMutualFund ? 'Investment Details' : 'Policy Details' }}
            </h4>
            <div class="detail-rows">
              <div class="detail-row">
                <span class="detail-label">Policy Type</span>
                <span class="detail-value type-badge">{{ policy.policyTypeName }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Start Date</span>
                <span class="detail-value">{{ policy.startDate | date:'dd MMM yyyy' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">End Date</span>
                <span class="detail-value">{{ policy.endDate | date:'dd MMM yyyy' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Duration</span>
                <span class="detail-value">{{ getDuration() }}</span>
              </div>
              <div class="detail-row" *ngIf="policy.installmentType">
                <span class="detail-label">{{ isMutualFund ? 'Investment Frequency' : 'Installment Type' }}</span>
                <span class="detail-value">{{ policy.installmentType === 'One Time' && isMutualFund ? 'Lump Sum' : policy.installmentType }}</span>
              </div>
              <div class="detail-row" *ngIf="policy.nextInstallmentDate">
                <span class="detail-label">{{ isMutualFund ? 'Next SIP / Payment Date' : 'Next Installment' }}</span>
                <span class="detail-value text-primary font-bold">{{ policy.nextInstallmentDate | date:'dd MMM yyyy' }}</span>
              </div>
            </div>
          </div>

          <!-- Extended Details -->
          <div class="glass-card">
            <h4 class="section-title">
              <span class="material-icons-round">info</span>
              {{ isMutualFund ? 'Extended Investment Info' : 'Extended Info' }}
            </h4>
            <div class="detail-rows">
              <div class="detail-row" *ngIf="policy.schemeName">
                <span class="detail-label">{{ isMutualFund ? 'Folio Number' : 'Plan ID' }}</span>
                <span class="detail-value">{{ policy.schemeName }}</span>
              </div>
              <div class="detail-row" *ngIf="policy.companyName">
                <span class="detail-label">{{ isMutualFund ? 'AMC / Fund House' : 'Company' }}</span>
                <span class="detail-value">{{ policy.companyName }}</span>
              </div>
              <div class="detail-row" *ngIf="policy.productName">
                <span class="detail-label">{{ isMutualFund ? 'Scheme Name' : 'Product' }}</span>
                <span class="detail-value">{{ policy.productName }}</span>
              </div>
              <div class="detail-row" *ngIf="policy.locationUnit">
                <span class="detail-label">Location/Unit</span>
                <span class="detail-value">{{ policy.locationUnit }}</span>
              </div>
              <div class="detail-row" *ngIf="policy.duration">
                <span class="detail-label">{{ isMutualFund ? 'Lock-in Period' : 'Duration' }}</span>
                <span class="detail-value">{{ policy.duration }}</span>
              </div>
            </div>
          </div>

          <!-- Full Financials -->
          <div class="glass-card">
            <h4 class="section-title">
              <span class="material-icons-round">payments</span>
              Financial Summary
            </h4>
            <div class="detail-rows">
              <div class="detail-row">
                <span class="detail-label">{{ isMutualFund ? 'SIP / Investment' : 'Premium' }}</span>
                <span class="detail-value">{{ policy.premiumAmount | inrCurrency }}</span>
              </div>
              <div class="detail-row" *ngIf="policy.netPremium">
                <span class="detail-label">{{ isMutualFund ? 'Invested Capital' : 'Net Premium' }}</span>
                <span class="detail-value text-secondary">{{ policy.netPremium | inrCurrency }}</span>
              </div>
              <div class="detail-row" *ngIf="policy.taxAmount">
                <span class="detail-label">{{ isMutualFund ? 'Stamp Duty / Charges' : 'Tax Amount' }}</span>
                <span class="detail-value">{{ policy.taxAmount | inrCurrency }}</span>
              </div>
               <div class="detail-row" *ngIf="policy.gstApplicable">
                <span class="detail-label">{{ isMutualFund ? 'Exit Load Applicable' : 'GST Applicable' }}</span>
                <span class="detail-value">{{ policy.gstApplicable === 'Y' ? 'Yes' : 'No' }}</span>
              </div>
              <div class="detail-row" *ngIf="policy.installmentAmount">
                <span class="detail-label">{{ isMutualFund ? 'SIP Amount' : 'Inst. Amount' }}</span>
                <span class="detail-value text-primary">{{ policy.installmentAmount | inrCurrency }}</span>
              </div>
            </div>
          </div>

          <!-- Maturity & Agent -->
          <div class="glass-card">
            <h4 class="section-title">
              <span class="material-icons-round">event_available</span>
              {{ isMutualFund ? 'Redemption / Value & Agent' : 'Maturity & Agent' }}
            </h4>
            <div class="detail-rows">
              <div class="detail-row" *ngIf="policy.maturityDate">
                <span class="detail-label">{{ isMutualFund ? 'Redemption / End Date' : 'Maturity Date' }}</span>
                <span class="detail-value text-success font-bold">{{ policy.maturityDate | date:'dd MMM yyyy' }}</span>
              </div>
              <div class="detail-row" *ngIf="policy.totalMaturityAmount">
                <span class="detail-label">{{ isMutualFund ? 'Current Portfolio Value' : 'Maturity Amt' }}</span>
                <span class="detail-value text-success font-bold">{{ policy.totalMaturityAmount | inrCurrency }}</span>
              </div>
              <div class="detail-row" *ngIf="policy.agentName">
                <span class="detail-label">Agent</span>
                <span class="detail-value">{{ policy.agentName }}</span>
              </div>
              <div class="detail-row" *ngIf="policy.alternateContactNumber">
                <span class="detail-label">Alt Contact</span>
                <span class="detail-value">{{ policy.alternateContactNumber }}</span>
              </div>
            </div>
          </div>
          
          <!-- Annuity & Payment Terms (NEW) -->
          <div class="glass-card" *ngIf="policy.annuityDate || policy.annuityAmount || policy.autoDebit">
            <h4 class="section-title">
              <span class="material-icons-round">account_balance_wallet</span>
              Annuity & Auto Debit
            </h4>
            <div class="detail-rows">
              <div class="detail-row" *ngIf="policy.annuityDate">
                <span class="detail-label">Annuity Date</span>
                <span class="detail-value text-primary">{{ policy.annuityDate | date:'dd MMM yyyy' }}</span>
              </div>
              <div class="detail-row" *ngIf="policy.annuityAmount">
                <span class="detail-label">Annuity Amt</span>
                <span class="detail-value">{{ policy.annuityAmount | inrCurrency }}</span>
              </div>
              <div class="detail-row" *ngIf="policy.autoDebit">
                <span class="detail-label">Auto Debit</span>
                <span class="detail-value" [style.color]="policy.autoDebit === 'Y' ? '#10b981' : '#ef4444'">
                  {{ policy.autoDebit === 'Y' ? 'Enabled' : 'Disabled' }}
                </span>
              </div>
              <div class="detail-row" *ngIf="policy.termYears">
                <span class="detail-label">Term Years</span>
                <span class="detail-value">{{ policy.termYears }}</span>
              </div>
              <div class="detail-row" *ngIf="policy.payingTerm">
                <span class="detail-label">Paying Term</span>
                <span class="detail-value">{{ policy.payingTerm }}</span>
              </div>
            </div>
          </div>

          <!-- Financial -->
          <div class="glass-card">
            <h4 class="section-title">
              <span class="material-icons-round">account_balance</span>
              Financial Overview
            </h4>
            <div class="financial-cards">
              <div class="fin-card" [class.overdue-card]="calculatedPaidDetails?.isOverdue">
                <span class="fin-label">Total Paid up to date</span>
                <span class="fin-amount" [class.text-success]="!calculatedPaidDetails?.isOverdue" [class.text-warning]="calculatedPaidDetails?.isOverdue">
                  {{ (calculatedPaidDetails?.expectedAmount || 0) | inrCurrency }}
                </span>
                <div class="fin-subtext" *ngIf="calculatedPaidDetails?.isOverdue">
                  <span class="actual-paid-label">Actual Paid: {{ calculatedPaidDetails?.actualPaid | inrCurrency }}</span>
                  <span class="overdue-badge">Overdue: {{ calculatedPaidDetails?.overdueAmount | inrCurrency }}</span>
                </div>
              </div>
              <div class="fin-card">
                <span class="fin-label">Coverage Amount</span>
                <span class="fin-amount text-primary">{{ policy.coverageAmount | inrCurrency }}</span>
              </div>
            </div>

            <!-- Overdue Details Breakdown -->
            <div class="overdue-details-container" *ngIf="calculatedPaidDetails?.isOverdue">
              <div class="overdue-header">
                <span class="material-icons-round text-warning">warning</span>
                <span class="overdue-title">Payment Calculation Details (Overdue)</span>
              </div>
              <p class="overdue-description">
                The next installment was due on <strong>{{ policy.nextInstallmentDate | date:'dd MMM yyyy' }}</strong>. 
                Based on the <strong>{{ policy.installmentType }}</strong> payment frequency, 
                there are <strong>{{ calculatedPaidDetails?.overdueCount }}</strong> overdue installment(s) up to today.
              </p>
              <div class="overdue-breakdown-list">
                <div class="overdue-item" *ngFor="let missedDate of calculatedPaidDetails?.missedDates; let i = index">
                  <div class="overdue-item-left">
                    <span class="overdue-index">#{{ i + 1 }}</span>
                    <span class="overdue-date-label">Installment Due:</span>
                    <span class="overdue-date-value">{{ missedDate | date:'dd MMM yyyy' }}</span>
                  </div>
                  <span class="overdue-item-amount">{{ (policy.installmentAmount || policy.premiumAmount || 0) | inrCurrency }}</span>
                </div>
                <div class="overdue-item" *ngIf="calculatedPaidDetails?.overdueCount > 24" style="font-size: 0.75rem; font-style: italic; color: var(--text-secondary); text-align: center; justify-content: center; border-top: 1px dashed rgba(245, 158, 11, 0.15); width: 100%; display: flex; padding: 10px 0;">
                  Showing first 24 overdue installments...
                </div>
              </div>
              <div class="overdue-summary-row">
                <span>Total Overdue Amount:</span>
                <span class="text-warning font-bold">{{ calculatedPaidDetails?.overdueAmount | inrCurrency }}</span>
              </div>
            </div>
          </div>

          <!-- Nominee Info -->
          <div class="glass-card" *ngIf="policy.nomineeName">
            <h4 class="section-title">
              <span class="material-icons-round">family_restroom</span>
              Nominee Details
            </h4>
            <div class="detail-rows">
              <div class="detail-row">
                <span class="detail-label">Nominee Name</span>
                <span class="detail-value">{{ policy.nomineeName }}</span>
              </div>
              <div class="detail-row" *ngIf="policy.nomineeRelation">
                <span class="detail-label">Relationship</span>
                <span class="detail-value">{{ policy.nomineeRelation }}</span>
              </div>
            </div>
          </div>

        <!-- NEW: Payment Form (Conditional) -->
        <div class="glass-card mt-lg payment-form-card" *ngIf="showPaymentForm">
          <div class="d-flex justify-between align-center mb-md">
            <h4 class="section-title mb-0">
              <span class="material-icons-round">payment</span>
              Record Installment Payment
            </h4>
            <button class="btn btn-icon btn-secondary-outline sm" (click)="togglePaymentForm()">
              <span class="material-icons-round">close</span>
            </button>
          </div>
          <div class="form-grid-3">
            <div class="form-group">
              <label>Amount</label>
              <input type="number" class="form-control" [(ngModel)]="paymentForm.amount" name="amount">
            </div>
            <div class="form-group">
              <label>Method</label>
              <select class="form-control" [(ngModel)]="paymentForm.paymentMethod" name="method">
                <option value="Online">Online</option>
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
                <option value="UPI">UPI</option>
              </select>
            </div>
            <div class="form-group">
              <label>Transaction ID / Ref</label>
              <input type="text" class="form-control" [(ngModel)]="paymentForm.transactionId" name="txId" placeholder="Optional">
            </div>
          </div>
          <div class="form-group mt-sm">
            <label>Notes</label>
            <textarea class="form-control" rows="2" [(ngModel)]="paymentForm.notes" name="notes" placeholder="Optional notes..."></textarea>
          </div>
          <div class="d-flex justify-end mt-md">
             <button class="btn btn-primary" (click)="submitPayment()" [disabled]="markingPaid">
               <span class="spinner" *ngIf="markingPaid"></span>
               Confirm Payment
             </button>
          </div>
        </div>

        <!-- NEW: Payment History -->
        <div class="glass-card mt-lg">
          <h4 class="section-title">
            <span class="material-icons-round">history</span>
            Payment History
          </h4>
          <div class="payment-table-container">
            <table class="data-table" *ngIf="policy.payments && policy.payments.length > 0">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Ref ID</th>
                  <th>Processed By</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let p of policy.payments">
                  <td>{{ p.paymentDate | date:'dd MMM yyyy' }}</td>
                  <td class="font-bold text-success">{{ p.amount | inrCurrency }}</td>
                  <td>{{ p.paymentMethod }}</td>
                  <td><small class="text-muted">{{ p.transactionId || '-' }}</small></td>
                  <td>{{ p.processedByName }}</td>
                </tr>
              </tbody>
            </table>
            <div class="empty-state py-lg" *ngIf="!policy.payments || policy.payments.length === 0">
              <span class="material-icons-round text-muted mb-sm" style="font-size:32px">history</span>
              <p>No payment history found for this policy.</p>
            </div>
          </div>
        </div>

        <!-- NEW: Audit History -->
        <div class="glass-card mt-lg">
          <h4 class="section-title">
            <span class="material-icons-round">manage_search</span>
            Audit History
          </h4>
          <div class="payment-table-container">
            <table class="data-table" *ngIf="auditLogs && auditLogs.length > 0">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>User</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let log of auditLogs">
                  <td>{{ log.timestamp | date:'dd MMM yyyy, hh:mm a' }}</td>
                  <td>
                    <span class="badge" [class.badge-success]="log.action === 'Create'" [class.badge-primary]="log.action === 'Update'" [class.badge-danger]="log.action === 'Delete'">
                      {{ log.action }}
                    </span>
                  </td>
                  <td>{{ log.userName || 'System' }}</td>
                </tr>
              </tbody>
            </table>
            <div class="empty-state py-lg" *ngIf="!auditLogs || auditLogs.length === 0">
              <span class="material-icons-round text-muted mb-sm" style="font-size:32px">info</span>
              <p>No audit history available for this policy.</p>
            </div>
          </div>
        </div>

        <!-- NEW: Documents Section -->
        <div class="glass-card mt-lg">
          <div class="d-flex justify-between align-center mb-md">
            <h4 class="section-title mb-0">
              <span class="material-icons-round">attach_file</span>
              Policy Documents & Receipts
            </h4>
            <div class="d-flex gap-sm">
              <div class="upload-btn-wrapper">
                <button class="btn sm btn-secondary" [disabled]="uploading" style="display:flex;align-items:center;gap:6px; background: rgba(99,102,241,0.1); color: var(--color-primary-light)">
                  <span class="material-icons-round sm" style="font-size:16px">description</span>
                  Upload Policy
                </button>
                <input type="file" (change)="onFileSelected($event, 'Policy')" [disabled]="uploading" />
              </div>
              <div class="upload-btn-wrapper">
                <button class="btn sm btn-secondary" [disabled]="uploading" style="display:flex;align-items:center;gap:6px; background: rgba(16,185,129,0.1); color: #10b981">
                  <span class="material-icons-round sm" style="font-size:16px">receipt_long</span>
                  Upload Receipt
                </button>
                <input type="file" (change)="onFileSelected($event, 'Receipt')" [disabled]="uploading" />
              </div>
            </div>
          </div>
          
          <div class="doc-list" *ngIf="policy.documents && policy.documents.length > 0">
            <div class="doc-item" *ngFor="let doc of policy.documents">
              <div class="doc-info">
                <span class="material-icons-round file-icon" 
                      [style.color]="doc.documentType === 'Policy' ? 'var(--color-primary-light)' : '#10b981'">
                  {{ doc.documentType === 'Policy' ? 'description' : 'receipt_long' }}
                </span>
                <div>
                  <div class="doc-name">
                    {{ doc.fileName }}
                    <span class="badge badge-secondary" style="font-size:0.6rem; margin-left:8px; background:rgba(255,255,255,0.05)">
                      {{ doc.documentType }}
                    </span>
                  </div>
                  <div class="doc-meta">
                    {{ (doc.fileSize / 1024) | number:'1.0-2' }} KB • 
                    Uploaded on {{ doc.createdAt | date:'dd MMM yyyy' }}
                  </div>
                </div>
              </div>
              <div class="d-flex gap-sm">
                <a [href]="getDownloadUrl(doc.id)" target="_blank" class="btn btn-icon sm btn-secondary" title="View Document">
                  <span class="material-icons-round">visibility</span>
                </a>
                <a [href]="getDownloadUrl(doc.id)" target="_blank" class="btn btn-icon sm btn-secondary" title="Download Document">
                  <span class="material-icons-round">download</span>
                </a>
              </div>
            </div>
          </div>

          <div class="empty-state py-lg" *ngIf="!policy.documents || policy.documents.length === 0">
            <span class="material-icons-round text-muted mb-sm" style="font-size:32px">folder_open</span>
            <p>No documents uploaded yet.</p>
          </div>
        </div>
        </div>

        <div class="glass-card mt-md" *ngIf="policy.bankAccountDetails">
          <h4 class="section-title">
            <span class="material-icons-round">account_balance</span>
            Bank Account Details
          </h4>
          <p class="detail-value" style="font-size:0.95rem; color:var(--color-primary-light)">
            {{ policy.bankAccountDetails }}
          </p>
        </div>

        <div class="glass-card mt-md" *ngIf="policy.coverageDescription">
          <h4 class="section-title">
            <span class="material-icons-round">verified_user</span>
            Coverage Description
          </h4>
          <p class="text-secondary" style="font-size:0.9rem; line-height:1.6">
            {{ policy.coverageDescription }}
          </p>
        </div>

        <div class="glass-card mt-md" *ngIf="policy.specialRemarks">
          <h4 class="section-title">
            <span class="material-icons-round">comment</span>
            Special Remarks
          </h4>
          <p class="text-secondary" style="font-size:0.9rem; font-style:italic">
            {{ policy.specialRemarks }}
          </p>
        </div>

        <div class="glass-card mt-md" *ngIf="policy.additionalDetails">
          <h4 class="section-title">
            <span class="material-icons-round">more_horiz</span>
            Additional Details
          </h4>
          <p class="text-secondary" style="font-size:0.85rem">
            {{ policy.additionalDetails }}
          </p>
        </div>

        <!-- Meta info -->
        <div class="glass-card mt-lg meta-bar">
          <div class="meta-item" *ngIf="policy.createdByName">
            <span class="material-icons-round">person_outline</span>
            Created by <strong>{{ policy.createdByName }}</strong>
          </div>
          <div class="meta-item">
            <span class="material-icons-round">schedule</span>
            Created {{ policy.createdAt | timeAgo }}
          </div>
          <div class="meta-item" *ngIf="policy.updatedAt">
            <span class="material-icons-round">update</span>
            Updated {{ policy.updatedAt | timeAgo }}
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .page-container {
      padding-bottom: 120px;
    }

    .sticky-header {
      position: sticky;
      top: 0;
      z-index: 100;
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(20px);
      padding: 16px 24px;
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 20px;
      margin-bottom: var(--space-xl);
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5);
    }

    .header-left { display: flex; align-items: center; gap: 16px; }

    .btn-icon-back {
      background: transparent;
      border: none;
      color: var(--text-primary);
      padding: 12px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      transition: background var(--transition-base);
    }

    .btn-icon-back:hover { background: rgba(255,255,255,0.05); }

    .header-title-area .page-title { 
      font-size: 1.5rem; 
      font-weight: 800;
      color: #fff;
      margin-bottom: 4px; 
    }
    .header-title-area .badge { padding: 2px 8px; font-size: 0.65rem; }

    .detail-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: var(--space-lg);
    }

    .glass-card {
      background: rgba(255, 255, 255, 0.02);
      backdrop-filter: blur(24px);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 24px;
      padding: 24px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
    }

    .glass-card:hover { 
      transform: translateY(-4px);
      border-color: rgba(255, 255, 255, 0.12);
      background: rgba(255, 255, 255, 0.04);
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    }

    .section-title {
      font-size: 0.8rem;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: var(--color-primary-light);
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      padding-bottom: 14px;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .section-title span.material-icons-round {
      font-size: 18px;
      color: var(--color-primary-light);
    }

    .detail-rows {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-top: 12px;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.03);
    }

    .detail-row:last-child {
      border-bottom: none;
    }

    .detail-label {
      font-size: 0.85rem;
      color: var(--text-secondary);
      font-weight: 500;
    }

    .detail-value {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text-white);
      text-align: right;
    }

    .type-badge {
      display: inline-block;
      padding: 4px 10px;
      font-size: 0.75rem;
      font-weight: 700;
      border-radius: 8px;
      background: rgba(99, 102, 241, 0.12);
      color: var(--color-primary-light);
      border: 1px solid rgba(99, 102, 241, 0.2);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .financial-cards {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-top: 12px;
    }

    .fin-card {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 16px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      align-items: center;
      text-align: center;
      transition: all var(--transition-base);
    }

    .fin-card:hover {
      background: rgba(255, 255, 255, 0.04);
      border-color: rgba(255, 255, 255, 0.1);
    }

    .fin-card.overdue-card {
      background: rgba(245, 158, 11, 0.03);
      border-color: rgba(245, 158, 11, 0.15);
    }
    
    .fin-card.overdue-card:hover {
      background: rgba(245, 158, 11, 0.06);
      border-color: rgba(245, 158, 11, 0.25);
    }

    .fin-subtext {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 0.75rem;
      margin-top: 4px;
      align-items: center;
    }

    .actual-paid-label {
      color: var(--text-secondary);
    }

    .overdue-badge {
      background: rgba(245, 158, 11, 0.15);
      color: #f59e0b;
      padding: 2px 8px;
      border-radius: 12px;
      font-weight: 600;
      border: 1px solid rgba(245, 158, 11, 0.25);
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .overdue-details-container {
      background: rgba(245, 158, 11, 0.02);
      border: 1px solid rgba(245, 158, 11, 0.1);
      border-radius: 18px;
      padding: 18px;
      margin-top: 16px;
      box-shadow: inset 0 0 20px rgba(245, 158, 11, 0.02);
    }

    .overdue-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;
    }

    .overdue-header span.material-icons-round {
      font-size: 20px;
    }

    .overdue-title {
      font-size: 0.9rem;
      font-weight: 700;
      color: #f59e0b;
    }

    .overdue-description {
      font-size: 0.8rem;
      color: var(--text-secondary);
      line-height: 1.5;
      margin-bottom: 14px;
      text-align: left;
    }

    .overdue-breakdown-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 200px;
      overflow-y: auto;
      padding-right: 4px;
    }

    .overdue-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      background: rgba(255, 255, 255, 0.01);
      border: 1px solid rgba(255, 255, 255, 0.04);
      border-radius: 10px;
    }

    .overdue-item-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .overdue-index {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-muted);
      width: 20px;
      text-align: left;
    }

    .overdue-date-label {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    .overdue-date-value {
      font-size: 0.8rem;
      font-weight: 600;
      color: #fff;
    }

    .overdue-item-amount {
      font-size: 0.8rem;
      font-weight: 700;
      color: #f59e0b;
    }

    .overdue-summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 10px;
      border-top: 1px solid rgba(245, 158, 11, 0.15);
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-secondary);
    }

    .fin-label {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--text-muted);
      letter-spacing: 0.5px;
    }

    .fin-amount {
      font-size: 1.5rem;
      font-weight: 800;
    }

    .upload-btn-wrapper {
      position: relative;
      overflow: hidden;
      display: inline-block;
    }

    .upload-btn-wrapper input[type=file] {
      font-size: 100px;
      position: absolute;
      left: 0;
      top: 0;
      opacity: 0;
      cursor: pointer;
    }

    .doc-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 12px;
    }

    .doc-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 18px;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 14px;
      transition: all var(--transition-base);
    }

    .doc-item:hover {
       border-color: var(--color-primary-light);
       background: rgba(99, 102, 241, 0.05);
    }

    .doc-info {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .file-icon {
      font-size: 28px;
    }

    .doc-name {
      font-size: 0.9rem;
      font-weight: 600;
      color: #fff;
      display: flex;
      align-items: center;
    }

    .doc-meta {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-top: 2px;
    }

    .form-grid-3 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      margin-bottom: 12px;
    }

    .payment-table-container {
      overflow-x: auto;
      margin-top: 12px;
    }

    .payment-table-container .data-table {
      width: 100%;
      border-collapse: collapse;
    }

    .payment-table-container th {
      padding: 10px 16px;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .payment-table-container td {
      padding: 12px 16px;
      font-size: 0.85rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    }

    .payment-table-container tr:last-child td {
      border-bottom: none;
    }

    .meta-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 24px;
      padding: 16px 24px;
      background: rgba(255, 255, 255, 0.01);
      border: 1px solid rgba(255, 255, 255, 0.04);
      border-radius: 16px;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.8rem;
      color: var(--text-secondary);
    }

    .meta-item span {
      font-size: 16px;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 10px;
      font-size: 0.7rem;
      font-weight: 700;
      border-radius: 30px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .badge-active {
      background: rgba(16, 185, 129, 0.15);
      color: var(--color-success);
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .badge-expired {
      background: rgba(239, 68, 68, 0.15);
      color: var(--color-danger);
      border: 1px solid rgba(239, 68, 68, 0.3);
    }

    .badge-pending {
      background: rgba(245, 158, 11, 0.15);
      color: var(--color-warning);
      border: 1px solid rgba(245, 158, 11, 0.3);
    }

    .badge-cancelled {
      background: rgba(100, 116, 139, 0.15);
      color: var(--text-muted);
      border: 1px solid rgba(100, 116, 139, 0.3);
    }

    select.form-control {
      appearance: none;
      -webkit-appearance: none;
      -moz-appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23cbd5e1'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E") !important;
      background-repeat: no-repeat !important;
      background-position: right 16px center !important;
      background-size: 18px !important;
      padding-right: 40px !important;
      cursor: pointer;
      background-color: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--border-color);
      height: 48px;
      border-radius: var(--radius-md);
      color: #fff;
      font-size: 0.95rem;
      transition: all var(--transition-base);
    }

    select.form-control:focus {
      border-color: var(--color-primary-light);
      background-color: rgba(255, 255, 255, 0.06);
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23818cf8'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E") !important;
      background-repeat: no-repeat !important;
      background-position: right 16px center !important;
      background-size: 18px !important;
      outline: none;
    }

    select.form-control option {
      background-color: #0f172a;
      color: #cbd5e1;
      padding: 12px;
      font-size: 0.95rem;
    }

    @media (max-width: 768px) {
      .sticky-header { padding: 12px 16px; flex-direction: column; align-items: flex-start; gap: 12px; }
      .header-actions.desktop-only { display: none; }
      .detail-grid { grid-template-columns: 1fr; }
      .financial-cards { grid-template-columns: 1fr; gap: 12px; }
      
      /* Mobile Floating Actions */
      .page-container::after {
        content: '';
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        height: 80px;
        background: linear-gradient(transparent, var(--bg-main));
        pointer-events: none;
        z-index: 90;
      }
    }
  `]
})
export class PolicyDetailComponent implements OnInit {
    policy: Policy | null = null;
    auditLogs: AuditLog[] = [];
    loading = true;

    get isMutualFund(): boolean {
        return this.policy?.policyTypeName?.toLowerCase() === 'mutual fund';
    }

    calculatedDetails: any = null;

    get calculatedPaidDetails() {
        return this.calculatedDetails;
    }

    updateCalculatedDetails(): void {
        if (!this.policy) {
            this.calculatedDetails = null;
            return;
        }

        const actualPaid = this.policy.totalPaidAmount || 0;
        const startDateStr = this.policy.startDate;
        const nextInstallmentDateStr = this.policy.nextInstallmentDate;
        const instType = this.policy.installmentType;
        const instAmount = this.policy.installmentAmount || this.policy.premiumAmount || 0;

        if (!startDateStr || !nextInstallmentDateStr || !instType || instAmount <= 0) {
            this.calculatedDetails = {
                isOverdue: false,
                expectedAmount: actualPaid,
                actualPaid: actualPaid,
                overdueAmount: 0,
                overdueCount: 0,
                missedDates: []
            };
            return;
        }

        const nextInstallmentDate = new Date(nextInstallmentDateStr);
        const startDate = new Date(startDateStr);

        // Safeguard against default/uninitialized dates (e.g. 0001-01-01 or Year < 1900)
        if (nextInstallmentDate.getFullYear() < 1900 || startDate.getFullYear() < 1900) {
            this.calculatedDetails = {
                isOverdue: false,
                expectedAmount: actualPaid,
                actualPaid: actualPaid,
                overdueAmount: 0,
                overdueCount: 0,
                missedDates: []
            };
            return;
        }

        // Safeguard if next installment is before start date (invalid business logic)
        if (nextInstallmentDate.getTime() < startDate.getTime()) {
            this.calculatedDetails = {
                isOverdue: false,
                expectedAmount: actualPaid,
                actualPaid: actualPaid,
                overdueAmount: 0,
                overdueCount: 0,
                missedDates: []
            };
            return;
        }

        // Normalize today's date (remove time part for comparison)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const nextInstallmentNoTime = new Date(nextInstallmentDate);
        nextInstallmentNoTime.setHours(0, 0, 0, 0);

        // Safeguard against invalid dates
        if (isNaN(nextInstallmentNoTime.getTime()) || isNaN(startDate.getTime())) {
            this.calculatedDetails = {
                isOverdue: false,
                expectedAmount: actualPaid,
                actualPaid: actualPaid,
                overdueAmount: 0,
                overdueCount: 0,
                missedDates: []
            };
            return;
        }

        if (nextInstallmentNoTime.getTime() >= today.getTime()) {
            // Next installment is in the future - no overdue amount
            this.calculatedDetails = {
                isOverdue: false,
                expectedAmount: actualPaid,
                actualPaid: actualPaid,
                overdueAmount: 0,
                overdueCount: 0,
                missedDates: []
            };
            return;
        }

        // Overdue detection & calculation
        let overdueCount = 0;
        const missedDates: Date[] = [];
        let currentDueDate = new Date(nextInstallmentDate);

        // Loop to find all missed installment dates up to today, with a safety cap of 500 to prevent infinite loops
        const maxIterations = 500;
        while (currentDueDate.getTime() < today.getTime() && overdueCount < maxIterations) {
            overdueCount++;
            
            // Only push the first 24 missed dates to the array to prevent heavy DOM rendering overhead in Angular
            if (missedDates.length < 24) {
                missedDates.push(new Date(currentDueDate));
            }

            const nextDate = new Date(currentDueDate);
            const type = instType.toLowerCase().trim();
            if (type === 'monthly') {
                nextDate.setMonth(nextDate.getMonth() + 1);
            } else if (type === 'quarterly') {
                nextDate.setMonth(nextDate.getMonth() + 3);
            } else if (type === 'half-yearly') {
                nextDate.setMonth(nextDate.getMonth() + 6);
            } else if (type === 'yearly') {
                nextDate.setFullYear(nextDate.getFullYear() + 1);
            } else if (type === 'one time') {
                break; // Lump sum stops repeating
            } else {
                nextDate.setMonth(nextDate.getMonth() + 1); // fallback
            }
            currentDueDate = nextDate;
        }

        const overdueAmount = overdueCount * instAmount;
        const expectedAmount = actualPaid + overdueAmount;

        this.calculatedDetails = {
            isOverdue: true,
            expectedAmount: expectedAmount,
            actualPaid: actualPaid,
            overdueAmount: overdueAmount,
            overdueCount: overdueCount,
            missedDates: missedDates
        };
    }

    markingPaid = false;
    showPaymentForm = false;
    uploading = false;
    paymentForm = {
        amount: 0,
        paymentMethod: 'Online',
        transactionId: '',
        notes: ''
    };

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private policyService: PolicyService,
        private toast: ToastService
    ) { }

    ngOnInit(): void {
        const id = Number(this.route.snapshot.paramMap.get('id'));
        if (!id) {
            this.router.navigate(['/policies']);
            return;
        }

        this.policyService.getPolicyById(id).subscribe({
            next: (res) => {
                this.policy = res.data;
                this.updateCalculatedDetails();
                this.loading = false;
                
                // Fetch audit logs after policy is loaded
                this.policyService.getPolicyHistory(id).subscribe({
                    next: (auditRes) => {
                        this.auditLogs = auditRes.data || [];
                    },
                    error: () => console.warn('Could not load audit history')
                });
            },
            error: () => {
                this.loading = false;
                this.router.navigate(['/policies']);
            }
        });
    }

    togglePaymentForm(): void {
        this.showPaymentForm = !this.showPaymentForm;
        if (this.showPaymentForm && this.policy) {
            this.paymentForm.amount = this.policy.premiumAmount;
        }
    }

    submitPayment(): void {
        if (!this.policy) return;
        if (this.paymentForm.amount <= 0) {
            this.toast.error('Amount must be greater than 0');
            return;
        }

        this.markingPaid = true;
        this.policyService.markAsPaid(this.policy.id, {
            policyId: this.policy.id,
            ...this.paymentForm,
            paymentDate: new Date().toISOString()
        }).subscribe({
            next: (res) => {
                this.markingPaid = false;
                if (res.success) {
                    this.policy = res.data;
                    this.updateCalculatedDetails();
                    this.showPaymentForm = false;
                    this.toast.success('Payment recorded. Installment schedule updated.');
                } else {
                    this.toast.error(res.message || 'Failed to record payment');
                }
            },
            error: (err) => {
                this.markingPaid = false;
                this.toast.error(err.error?.message || 'Error recording payment');
            }
        });
    }

    getDuration(): string {
        if (!this.policy) return '';
        const start = new Date(this.policy.startDate);
        const end = new Date(this.policy.endDate);
        const diffMs = end.getTime() - start.getTime();
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (days >= 365) return Math.floor(days / 365) + ' year(s)';
        if (days >= 30) return Math.floor(days / 30) + ' month(s)';
        return days + ' day(s)';
    }

    getDownloadUrl(documentId: number): string {
        return this.policyService.getDownloadUrl(documentId);
    }

    async onShare() {
        if (!this.policy) return;

        const shareText = `Policy Details:
        Number: ${this.policy.policyNumber}
        Type: ${this.policy.policyTypeName}
        Holder: ${this.policy.policyHolderName}
        Premium: ₹${this.policy.premiumAmount}
        Next Installment: ${this.policy.nextInstallmentDate ? new Date(this.policy.nextInstallmentDate).toLocaleDateString() : 'N/A'}
        Status: ${this.policy.status}`;

        if (Capacitor.isNativePlatform()) {
            await Share.share({
                title: 'Policy Details: ' + this.policy.policyNumber,
                text: shareText,
                url: window.location.href,
                dialogTitle: 'Share Policy Information',
            });
        } else {
            // Fallback for web
            if (navigator.share) {
                navigator.share({
                    title: 'Policy Details: ' + this.policy.policyNumber,
                    text: shareText,
                    url: window.location.href,
                }).catch(err => console.log('Error sharing', err));
            } else {
                this.toast.info('Sharing is not supported on this browser');
            }
        }
    }

    onFileSelected(event: any, type: string = 'Policy'): void {

        const file = event.target.files[0];
        if (!file || !this.policy) return;

        this.uploading = true;
        this.policyService.uploadDocument(this.policy.id, file, type).subscribe({
            next: (res) => {
                this.uploading = false;
                if (res.success && this.policy) {
                    if (!this.policy.documents) this.policy.documents = [];
                    this.policy.documents.push(res.data);
                    this.toast.success(`${type} uploaded successfully`);
                }
            },
            error: (err) => {
                this.uploading = false;
                this.toast.error(err.error?.message || 'Error uploading document');
            }
        });
    }

    copyPolicy(): void {
        if (!this.policy) return;
        this.router.navigate(['/policies/new'], { queryParams: { copyFrom: this.policy.id } });
    }

    goBack(): void {
        this.router.navigate(['/policies']);
    }
}
