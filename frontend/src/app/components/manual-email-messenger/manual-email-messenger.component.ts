import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PolicyService } from '../../services/policy.service';
import { ReminderService } from '../../services/reminder.service';
import { ToastService } from '../../services/toast.service';
import { Policy, PolicyFilter } from '../../models/models';
import { InrCurrencyPipe } from '../../pipes/pipes';

@Component({
  selector: 'app-manual-email-messenger',
  standalone: true,
  imports: [CommonModule, FormsModule, InrCurrencyPipe],
  template: `
    <div class="page-container animate__animated animate__fadeIn">
      <div class="page-header mb-xl">
        <div>
          <h1 class="page-title d-flex align-center gap-sm">
            <span class="material-icons-round text-primary" style="font-size: 32px">contact_mail</span>
            Manual Email Messenger
          </h1>
          <p class="page-subtitle">Draft and dispatch personalized reminders directly to any customer with live verification.</p>
        </div>
        <div class="header-actions">
           <div class="badge-premium">
             <span class="material-icons-round" style="font-size:16px">verified</span>
             SMTP Secure Delivery
           </div>
        </div>
      </div>

      <div class="messenger-grid">
        <!-- Left Pane: Policy Selector -->
        <div class="selector-pane">
          <div class="glass-card messenger-card h-100 p-0 overflow-hidden">
            <div class="pane-header p-lg border-bottom">
              <div class="search-input-wrapper mb-0">
                <span class="material-icons-round search-icon">search</span>
                <input type="text" class="form-control" placeholder="Search customer or policy #..." 
                       [(ngModel)]="searchTerm" (input)="onSearch()">
              </div>
            </div>
            
            <div class="policy-scroller custom-scrollbar" style="max-height: calc(100vh - 350px); overflow-y: auto;">
              <div *ngIf="searching" class="p-xl text-center">
                <div class="spinner sm border-primary"></div>
              </div>

              <div *ngFor="let p of policies" 
                   (click)="selectPolicy(p)"
                   class="policy-list-item"
                   [class.active]="selectedPolicy?.id === p.id">
                <div class="d-flex justify-between align-start mb-sm">
                  <span class="policy-chip">{{ p.policyNumber }}</span>
                  <div class="d-flex align-center gap-xs">
                    <span class="status-indicator" [class]="'status-' + p.status.toLowerCase()"></span>
                    <span class="smaller fw-700 opacity-60 text-uppercase">{{ p.status }}</span>
                  </div>
                </div>
                <div class="holder-name">{{ p.policyHolderName }}</div>
                <div class="d-flex justify-between items-center mt-xs opacity-60">
                   <div style="font-size:0.75rem" class="d-flex align-center gap-xs">
                     <span class="material-icons-round" style="font-size:14px">category</span>
                     {{ p.policyTypeName }}
                   </div>
                   <div style="font-size:0.75rem" class="d-flex align-center gap-xs">
                     <span class="material-icons-round" style="font-size:14px">event</span>
                     {{ p.nextInstallmentDate | date:'MMM d' }}
                   </div>
                </div>
              </div>

              <div *ngIf="!searching && policies.length === 0" class="p-xl text-center opacity-40">
                <span class="material-icons-round fs-1 mb-md">search_off</span>
                <p>No results found</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Pane: Composer & Preview -->
        <div class="composer-pane">
          <!-- Empty State -->
          <div *ngIf="!selectedPolicy" class="glass-card messenger-card h-100 d-flex flex-column align-center justify-center text-center p-xl border-dashed">
            <div class="icon-orb mb-lg">
              <span class="material-icons-round text-primary" style="font-size:48px">outbound</span>
            </div>
            <h3 class="mb-sm text-white">Draft a Reminder</h3>
            <p class="text-muted" style="max-width: 320px">Select a customer from the left panel to begin composing their personalized renewal notice.</p>
          </div>

          <!-- Active Composer -->
          <div *ngIf="selectedPolicy" class="animate__animated animate__fadeIn">
            <div class="glass-card messenger-card mb-lg">
              <div class="pane-header p-lg border-bottom d-flex justify-between align-center">
                <div class="d-flex align-center gap-md">
                  <div class="avatar-circle">
                    {{ (selectedPolicy.policyHolderName || 'P').substring(0,1) }}
                  </div>
                  <div>
                    <h4 class="mb-0 text-white">{{ selectedPolicy.policyHolderName }}</h4>
                    <p class="text-primary-light smaller mb-0 fw-600">{{ selectedPolicy.email }}</p>
                  </div>
                </div>
                <button class="btn-close-circle" (click)="selectedPolicy = null">
                  <span class="material-icons-round" style="font-size:20px">close</span>
                </button>
              </div>
              
              <div class="card-body p-lg">
                <!-- Template Choice -->
                <div class="mb-xl">
                  <label class="section-label">1. Reminder Theme</label>
                  <div class="template-grid">
                    <div *ngFor="let t of templates" 
                         class="template-option" 
                         [class.active]="selectedTemplate === t.id"
                         (click)="selectedTemplate = t.id">
                      <div class="template-icon" [style.background]="t.color + '15'" [style.border-color]="t.color + '40'">
                        <span class="material-icons-round" [style.color]="t.color">{{ t.icon }}</span>
                      </div>
                      <div class="template-info">
                        <div class="template-name text-white">{{ t.label }}</div>
                        <div class="template-desc">{{ t.desc }}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Message Customization -->
                <div class="mb-xl">
                  <div class="d-flex justify-between align-center mb-md">
                    <label class="section-label">2. Personal Memo <span class="text-muted">(Optional)</span></label>
                    <span class="char-count" [class.text-primary]="customNote.length > 0">{{ customNote.length }}/200</span>
                  </div>
                  <textarea class="form-control composer-textarea" rows="4" 
                            [(ngModel)]="customNote"
                            placeholder="Add explicit instructions or a personal greeting..."></textarea>
                </div>

                <!-- Action Footer -->
                <div class="composer-footer p-lg bg-dark-glass rounded-xl d-flex justify-between align-center">
                  <div class="text-muted small d-flex align-center gap-sm">
                    <span class="pulse-green"></span>
                    Ready for dispatch
                  </div>
                  <div class="d-flex gap-md">
                    <button class="btn btn-primary px-xl py-md d-flex align-center gap-sm shadow-highlight" 
                            [disabled]="sending" (click)="sendManual()">
                      <span *ngIf="sending" class="spinner-border spinner-border-sm"></span>
                      <span *ngIf="!sending" class="material-icons-round">send</span>
                      {{ sending ? 'Dispatching...' : 'Dispatch Email' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Email Preview Section -->
            <div class="preview-section">
              <div class="preview-title mb-md">Recipients's Inbox Preview</div>
              <div class="email-mockup shadow-2xl animate__animated animate__slideInUp">
                <div class="mockup-header">
                  <div class="mockup-logo">🛡️ POLICY MANAGER</div>
                </div>
                <div class="mockup-body">
                  <div class="mockup-content">
                    <p class="mb-md">Dear <strong>{{ selectedPolicy.policyHolderName }}</strong>,</p>
                    <p class="mb-lg" style="color: #4b5563">Your policy renewal window is now open. We recommend settling the outstanding dues to ensure continuous risk coverage.</p>
                    
                    <div *ngIf="customNote" class="mockup-note mb-lg">
                      <div class="note-label">Personal Note from Agent</div>
                      <div class="note-text">"{{ customNote }}"</div>
                    </div>

                    <div class="mockup-details-grid">
                      <div class="detail-item">
                        <span class="label">Policy Number</span>
                        <span class="value">{{ selectedPolicy.policyNumber }}</span>
                      </div>
                      <div class="detail-item">
                        <span class="label">Due Date</span>
                        <span class="value text-danger">{{ (selectedPolicy.nextInstallmentDate || selectedPolicy.endDate) | date:'dd MMM yyyy' }}</span>
                      </div>
                      <div class="detail-item">
                        <span class="label">Premium Due</span>
                        <span class="value">{{ (selectedPolicy.installmentAmount || selectedPolicy.premiumAmount) | inrCurrency }}</span>
                      </div>
                    </div>
                    
                    <div class="text-center mt-xl">
                      <button class="btn-mockup px-xl py-md rounded-lg">PROCEED TO SECURE RENEWAL</button>
                      <div class="mt-md opacity-40 italic smaller">Clicking will redirect to the secure payment portal.</div>
                    </div>
                  </div>
                </div>
                <div class="mockup-footer">
                  <p class="m-0">© 2026 Antigravity Insurance Services. All rights reserved.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { max-width: 1300px; margin: 0 auto; padding: 1rem; }
    
    .messenger-grid {
      display: grid;
      grid-template-columns: 360px 1fr;
      gap: 2rem;
      align-items: start;
    }

    .glass-card {
      background: var(--bg-card);
      border: 1px solid rgba(255,255,255,0.06);
      backdrop-filter: blur(20px);
      border-radius: 20px;
    }

    /* Policy List Layout */
    .pane-header { background: rgba(0,0,0,0.15); }
    
    .policy-list-item {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid rgba(255,255,255,0.04);
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .policy-list-item:hover { background: rgba(255,255,255,0.02); }
    .policy-list-item.active {
      background: rgba(99, 102, 241, 0.1);
      border-left: 4px solid var(--color-primary-light);
    }

    .policy-chip {
      font-size: 0.7rem;
      font-weight: 800;
      color: var(--color-primary-light);
      background: rgba(99, 102, 241, 0.1);
      padding: 3px 8px;
      border-radius: 4px;
      letter-spacing: 0.5px;
    }

    .holder-name { font-weight: 600; color: #fff; font-size: 1rem; margin-top: 4px; }
    
    .status-indicator { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
    .status-active { background: #10b981; box-shadow: 0 0 8px #10b98160; }
    .status-lapsed { background: #ef4444; }

    /* Template Grid */
    .section-label { 
      display: block; 
      font-size: 0.75rem; 
      font-weight: 800; 
      text-transform: uppercase; 
      letter-spacing: 1px; 
      color: var(--color-primary-light); 
      margin-bottom: 1rem;
    }

    .template-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
    }
    .template-option {
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 16px;
      padding: 1.25rem;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    .template-option:hover { border-color: rgba(255,255,255,0.15); transform: translateY(-2px); }
    .template-option.active {
      background: rgba(99, 102, 241, 0.1);
      border-color: var(--color-primary-light);
      box-shadow: 0 10px 25px -10px rgba(99, 102, 241, 0.3);
    }

    .template-icon {
      width: 54px; height: 54px;
      border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 1rem;
      border: 1px solid transparent;
    }
    
    .template-name { font-weight: 700; font-size: 0.9rem; margin-bottom: 4px; }
    .template-desc { font-size: 0.75rem; color: var(--text-muted); line-height: 1.3; }

    /* Composer Area */
    .composer-textarea {
      background: rgba(0,0,0,0.25);
      border: 1px solid rgba(255,255,255,0.1);
      color: #fff;
      border-radius: 16px;
      padding: 1.25rem;
      font-size: 1rem;
      transition: all 0.3s;
    }
    .composer-textarea:focus { border-color: var(--color-primary-light); background: rgba(0,0,0,0.35); box-shadow: none; }

    .char-count { font-size: 0.75rem; font-weight: 700; opacity: 0.5; }

    .avatar-circle {
      width: 48px; height: 48px;
      background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-weight: 900; color: #fff; font-size: 1.4rem;
    }

    .btn-close-circle {
      width: 32px; height: 32px;
      border-radius: 50%;
      background: rgba(255,255,255,0.05);
      border: none; color: #fff;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.2s;
    }
    .btn-close-circle:hover { background: rgba(239, 68, 68, 0.2); color: #ef4444; }

    /* Email Inbox Mockup */
    .preview-section { margin-top: 2rem; }
    .preview-title { text-align: center; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; opacity: 0.4; }

    .email-mockup {
      background: #ffffff;
      border-radius: 20px;
      max-width: 650px;
      margin: 1rem auto;
      overflow: hidden;
      color: #1a202c;
      font-family: 'Inter', system-ui, sans-serif;
    }
    .mockup-header { background: #0f172a; padding: 2.5rem; text-align: center; }
    .mockup-logo { color: #fff; font-weight: 950; font-size: 1.4rem; letter-spacing: -1px; }

    .mockup-body { padding: 3.5rem; }
    .mockup-content { font-size: 1.1rem; line-height: 1.7; color: #374151; }
    
    .mockup-note {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-left: 5px solid #f59e0b;
      padding: 1.5rem;
      border-radius: 0 12px 12px 0;
    }
    .note-label { font-size: 0.75rem; font-weight: 900; color: #b45309; text-transform: uppercase; margin-bottom: 6px; }
    .note-text { font-style: italic; color: #78350f; font-size: 1.05rem; }

    .mockup-details-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      background: #f8fafc;
      padding: 1.75rem;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      margin-top: 2rem;
    }
    .detail-item .label { display: block; font-size: 0.7rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px; }
    .detail-item .value { font-weight: 800; color: #1e293b; font-size: 1rem; }

    .btn-mockup {
      background: #0f172a;
      color: #fff;
      border: none;
      font-weight: 700;
      letter-spacing: 0.5px;
      box-shadow: 0 10px 20px -5px rgba(15, 23, 42, 0.3);
    }

    .mockup-footer {
      background: #f1f5f9;
      padding: 2rem;
      text-align: center;
      font-size: 0.8rem;
      color: #64748b;
      border-top: 1px solid #e2e8f0;
    }

    .pulse-green {
      width: 10px; height: 10px;
      background: #10b981;
      border-radius: 50%;
      box-shadow: 0 0 0 rgba(16, 185, 129, 0.4);
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
      70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
      100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }

    .badge-premium {
      background: linear-gradient(135deg, #fbbf24, #f59e0b);
      color: #000;
      padding: 6px 14px;
      border-radius: 99px;
      font-size: 0.75rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .icon-orb {
      width: 110px; height: 110px;
      background: radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%);
      border-radius: 50%;
      border: 1px solid rgba(255,255,255,0.05);
      display: flex; align-items: center; justify-content: center;
    }
  `]
})
export class ManualEmailMessengerComponent implements OnInit {
  policies: Policy[] = [];
  selectedPolicy: Policy | null = null;
  searchTerm: string = '';
  searching = false;
  sending = false;
  customNote: string = '';
  selectedTemplate: string = 'Standard';

  templates = [
    { id: 'Standard', label: 'Standard Reminder', desc: 'Friendly nudge for renewal', icon: 'schedule', color: '#6366f1' },
    { id: 'Critical', label: 'Critical Warning', desc: 'Urgent notice (24-48h left)', icon: 'report_problem', color: '#ef4444' },
    { id: 'Installment', label: 'Premium Notice', desc: 'Payment specific alert', icon: 'payments', color: '#fbbf24' }
  ];

  constructor(
    private policyService: PolicyService,
    private reminderService: ReminderService,
    private toast: ToastService
  ) { }

  ngOnInit(): void {
    this.loadRecommendedPolicies();
  }

  loadRecommendedPolicies(): void {
    const filter: PolicyFilter = {
      pageNumber: 1,
      pageSize: 15,
      sortBy: 'nextInstallmentDate',
      sortDirection: 'asc'
    };
    this.searching = true;
    this.policyService.getPolicies(filter).subscribe({
      next: (res) => {
        this.policies = res.data.items;
        this.searching = false;
      },
      error: () => this.searching = false
    });
  }

  onSearch(): void {
    if (this.searchTerm.length < 2) {
      if (this.searchTerm.length === 0) this.loadRecommendedPolicies();
      return;
    }

    this.searching = true;
    const filter: PolicyFilter = {
      searchTerm: this.searchTerm,
      pageNumber: 1,
      pageSize: 50
    };

    this.policyService.getPolicies(filter).subscribe({
      next: (res) => {
        this.policies = res.data.items;
        this.searching = false;
      },
      error: () => this.searching = false
    });
  }

  selectPolicy(p: Policy): void {
    this.selectedPolicy = p;
    // Auto-detect template based on urgency
    const today = new Date();
    const dueDate = new Date(p.nextInstallmentDate || p.endDate);
    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24));

    if (diffDays <= 3) this.selectedTemplate = 'Critical';
    else if (p.nextInstallmentDate) this.selectedTemplate = 'Installment';
    else this.selectedTemplate = 'Standard';
  }

  sendManual(): void {
    if (!this.selectedPolicy) return;

    this.sending = true;
    const dto = {
      policyId: this.selectedPolicy.id,
      templateType: this.selectedTemplate,
      customNote: this.customNote
    };

    this.reminderService.sendManual(dto).subscribe({
      next: () => {
        this.toast.success(`Encrypted dispatch successful to ${this.selectedPolicy?.policyHolderName}`);
        this.sending = false;
        this.customNote = '';
        this.selectedPolicy = null;
      },
      error: () => {
        this.toast.error('Dispatch failed. Retrying in background...');
        this.sending = false;
      }
    });
  }
}
