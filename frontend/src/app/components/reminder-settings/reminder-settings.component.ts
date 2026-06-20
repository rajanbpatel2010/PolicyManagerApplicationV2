import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReminderService } from '../../services/reminder.service';
import { ToastService } from '../../services/toast.service';
import { PolicyReminderSetting, UpdateReminderSetting } from '../../models/models';

@Component({
  selector: 'app-reminder-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container animate__animated animate__fadeIn">
      <!-- Header -->
      <div class="page-header mb-xl">
        <div>
          <h1 class="page-title d-flex align-center gap-sm">
            <span class="material-icons-round text-primary" style="font-size: 32px">settings_suggest</span>
            Reminder Scheduler Config
          </h1>
          <p class="page-subtitle">Manage automated payment intimations and scan schedules across all policy types.</p>
        </div>
        <div class="header-actions">
           <div class="badge badge-success-light p-2 px-3 d-flex align-center gap-xs">
             <span class="pulse-green"></span>
             Service Running
           </div>
        </div>
      </div>

      <div class="config-grid">
        <!-- Configuration Table -->
        <div class="config-main">
          <div class="glass-card h-100 overflow-hidden">
            <div class="pane-header p-lg border-bottom d-flex justify-between align-center">
              <h5 class="mb-0 text-white">Rule definitions</h5>
              <div *ngIf="loading" class="spinner sm primary"></div>
            </div>
            
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Policy Category</th>
                    <th class="text-center">Status</th>
                    <th>Frequency (Days Out)</th>
                    <th class="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let setting of settings" class="policy-row">
                    <td>
                      <div class="d-flex align-center gap-md">
                        <div class="icon-sq" [style.background]="getIconColor(setting.policyTypeName) + '15'">
                           <span class="material-icons-round" [style.color]="getIconColor(setting.policyTypeName)">{{ getIcon(setting.policyTypeName) }}</span>
                        </div>
                        <span class="fw-700 text-white">{{ setting.policyTypeName }}</span>
                      </div>
                    </td>
                    <td class="text-center">
                      <label class="switch">
                        <input type="checkbox" [(ngModel)]="setting.isEnabled">
                        <span class="slider round"></span>
                      </label>
                    </td>
                    <td>
                      <div class="d-flex align-center gap-sm">
                        <input type="number" class="form-control text-center" 
                               style="width: 70px; background: rgba(0,0,0,0.2)"
                               [(ngModel)]="setting.daysBeforeDue" 
                               [disabled]="!setting.isEnabled"
                               min="1" max="365">
                        <span class="smaller opacity-40">days prior</span>
                      </div>
                    </td>
                    <td class="text-end">
                      <button class="btn btn-primary btn-sm px-4 fw-800" (click)="onSave(setting)">
                        Update
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div class="p-lg bg-dark-glass border-top d-flex align-center gap-sm text-info">
              <span class="material-icons-round" style="font-size:18px">info</span>
              <small class="opacity-80">Automated engine scans daily at 00:00 UTC and ques pending emails for delivery.</small>
            </div>
          </div>
        </div>

        <!-- System Controls -->
        <div class="config-sidebar">
          <div class="glass-card p-lg mb-lg">
            <h5 class="mb-lg d-flex align-center gap-sm">
              <span class="material-icons-round text-warning">speed</span>
              Manual Triggers
            </h5>
            
            <div class="d-grid gap-md">
              <button class="control-btn scan-btn" [disabled]="scanning" (click)="onRunScan()">
                 <div class="btn-inner">
                    <span class="material-icons-round icon">{{ scanning ? 'sync' : 'search' }}</span>
                    <div class="btn-text">
                      <div class="label">Trigger System Scan</div>
                      <div class="sub">Find policies due soon</div>
                    </div>
                 </div>
              </button>

              <button class="control-btn process-btn" [disabled]="processing" (click)="onRunProcessing()">
                 <div class="btn-inner">
                    <span class="material-icons-round icon">{{ processing ? 'sync' : 'mark_email_unread' }}</span>
                    <div class="btn-text">
                      <div class="label">Dispatch Queue</div>
                      <div class="sub">Send pending draft emails</div>
                    </div>
                 </div>
              </button>
            </div>
          </div>

          <div class="glass-card p-0 overflow-hidden">
            <div class="pane-header p-lg border-bottom d-flex justify-between align-center">
              <h5 class="mb-0 d-flex align-center gap-sm">
                <span class="material-icons-round text-info">history</span>
                Live Audit Log
              </h5>
              <button class="btn-icon" (click)="loadLogs()" title="Refresh Logs">
                 <span class="material-icons-round" style="font-size:18px">refresh</span>
              </button>
            </div>
            <div class="log-scroller custom-scrollbar" style="max-height: 400px; overflow-y: auto;">
               <div *ngFor="let log of logs" class="log-item p-md border-bottom">
                  <div class="d-flex justify-between align-start mb-xs">
                     <span class="log-policy">{{ log.policyNumber }}</span>
                     <span class="log-status" [class]="'status-' + log.status.toLowerCase()">{{ log.status }}</span>
                  </div>
                  <div class="log-recipient text-white">{{ log.recipientEmail }}</div>
                  <div class="d-flex justify-between mt-xs smaller opacity-50">
                     <span>{{ log.daysBeforeDue }}d lead</span>
                     <span>{{ log.createdAt | date:'MMM d, HH:mm' }}</span>
                  </div>
               </div>
               <div *ngIf="logs.length === 0" class="p-xl text-center opacity-40 smaller">
                 No recent activity detected
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { max-width: 1300px; margin: 0 auto; padding: 2rem; }
    
    .config-grid {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 2rem;
      align-items: start;
    }

    .glass-card {
      background: var(--bg-card);
      border: 1px solid rgba(255,255,255,0.06);
      backdrop-filter: blur(20px);
      border-radius: 20px;
    }

    .pane-header { background: rgba(0,0,0,0.15); }
    .border-bottom { border-bottom: 1px solid rgba(255,255,255,0.06); }
    .bg-dark-glass { background: rgba(0,0,0,0.2); }

    /* Custom Switch Styling */
    .switch { position: relative; display: inline-block; width: 44px; height: 22px; }
    .switch input { opacity: 0; width: 0; height: 0; }
    .slider {
      position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
      background-color: rgba(255,255,255,0.1); transition: .4s; border-radius: 34px;
    }
    .slider:before {
      position: absolute; content: ""; height: 16px; width: 16px; left: 3px; bottom: 3px;
      background-color: white; transition: .4s; border-radius: 50%;
    }
    input:checked + .slider { background-color: var(--color-primary); }
    input:checked + .slider:before { transform: translateX(22px); }

    /* Control Buttons */
    .control-btn {
      border: none;
      padding: 1.25rem;
      border-radius: 16px;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.06);
      color: #fff;
      transition: all 0.3s;
      text-align: left;
    }
    .btn-inner { display: flex; align-items: center; gap: 1rem; }
    .control-btn .icon {
      width: 44px; height: 44px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      background: rgba(255,255,255,0.05);
      transition: all 0.3s;
    }
    .control-btn .label { font-weight: 800; font-size: 0.95rem; line-height: 1; }
    .control-btn .sub { font-size: 0.75rem; color: var(--text-muted); margin-top: 4px; }
    
    .scan-btn:hover { border-color: var(--color-primary-light); background: rgba(99, 102, 241, 0.05); }
    .scan-btn:hover .icon { background: var(--color-primary); color: #fff; }
    
    .process-btn:hover { border-color: #10b981; background: rgba(16, 185, 129, 0.05); }
    .process-btn:hover .icon { background: #10b981; color: #fff; }

    /* Audit Logs */
    .log-item { transition: background 0.2s; }
    .log-item:hover { background: rgba(255,255,255,0.02); }
    .log-policy { font-size: 0.75rem; font-weight: 800; color: var(--color-primary-light); }
    .log-status { font-size: 0.65rem; font-weight: 900; text-transform: uppercase; padding: 2px 6px; border-radius: 4px; }
    .status-sent { background: rgba(16, 185, 129, 0.1); color: #10b981; }
    .status-pending { background: rgba(251, 191, 36, 0.1); color: #fbbf24; }
    .status-failed { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

    .icon-sq { width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

    .pulse-green {
      width: 8px; height: 8px; background: #10b981; border-radius: 50%;
      animation: pulse 2s infinite; display: inline-block;
    }
    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
      70% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
      100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }

    .btn-icon {
       background: transparent; border: none; color: #fff; opacity: 0.5;
       padding: 4px; border-radius: 4px; transition: all 0.2s;
    }
    .btn-icon:hover { opacity: 1; background: rgba(255,255,255,0.1); }
  `]
})
export class ReminderSettingsComponent implements OnInit {
  settings: PolicyReminderSetting[] = [];
  logs: any[] = [];
  loading = false;
  scanning = false;
  processing = false;

  constructor(
    private reminderService: ReminderService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadSettings();
    this.loadLogs();
  }

  getIcon(type: string): string {
    if (type.toLowerCase().includes('car')) return 'directions_car';
    if (type.toLowerCase().includes('health')) return 'health_and_safety';
    if (type.toLowerCase().includes('life')) return 'favorite';
    if (type.toLowerCase().includes('home')) return 'home';
    return 'description';
  }

  getIconColor(type: string): string {
    if (type.toLowerCase().includes('car')) return '#6366f1';
    if (type.toLowerCase().includes('health')) return '#ef4444';
    if (type.toLowerCase().includes('life')) return '#ec4899';
    if (type.toLowerCase().includes('home')) return '#10b981';
    return '#6366f1';
  }

  loadSettings(): void {
    this.loading = true;
    this.reminderService.getSettings().subscribe({
      next: (resp) => {
        this.settings = resp.data;
        this.loading = false;
      },
      error: () => {
        this.toastService.error('Failed to load reminder settings');
        this.loading = false;
      }
    });
  }

  loadLogs(): void {
    this.reminderService.getLogs(15).subscribe({
      next: (resp) => {
        this.logs = resp.data;
      }
    });
  }

  onRunScan(): void {
    this.scanning = true;
    this.reminderService.runScan().subscribe({
      next: (resp) => {
        this.toastService.success(resp.message || 'System scan successful');
        this.scanning = false;
        this.loadLogs();
      },
      error: () => {
        this.toastService.error('Manual scan engine failed');
        this.scanning = false;
      }
    });
  }

  onRunProcessing(): void {
    this.processing = true;
    this.reminderService.processPending().subscribe({
      next: (resp) => {
        this.toastService.success(resp.message || 'Queue dispatch complete');
        this.processing = false;
        this.loadLogs();
      },
      error: () => {
        this.toastService.error('Email dispatch motor failed');
        this.processing = false;
      }
    });
  }

  onSave(setting: PolicyReminderSetting): void {
    const update: UpdateReminderSetting = {
      isEnabled: setting.isEnabled,
      daysBeforeDue: setting.daysBeforeDue
    };

    this.reminderService.updateSetting(setting.id, update).subscribe({
      next: () => {
        this.toastService.success(`Configuration deployed for ${setting.policyTypeName}`);
      },
      error: () => {
        this.toastService.error('Failed to deploy config update');
      }
    });
  }
}
