import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuditLogService } from '../../services/policy.service';
import { AuditLog, PagedResult } from '../../models/models';
import { TimeAgoPipe } from '../../pipes/pipes';

@Component({
    selector: 'app-audit-logs',
    standalone: true,
    imports: [CommonModule, TimeAgoPipe],
    template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Audit Logs</h1>
          <p class="page-subtitle">Track all system activities and changes</p>
        </div>
      </div>

      <!-- Visualization Summary -->
      <div class="audit-summary mb-lg" *ngIf="summary">
        <div class="stat-card" *ngFor="let item of summary | keyvalue">
          <div class="stat-icon" [class]="getActionBadge(item.key.toString())">
            <span class="material-icons-round">{{ getActionIcon(item.key.toString()) }}</span>
          </div>
          <div class="stat-details">
            <span class="stat-value">{{ item.value }}</span>
            <span class="stat-label">{{ item.key }}</span>
          </div>
        </div>
      </div>

      <div class="loading-overlay" *ngIf="loading">
        <div class="spinner"></div>
        <p>Loading audit logs...</p>
      </div>

      <div class="glass-card" *ngIf="!loading" style="padding:0;overflow:hidden">
        <div style="overflow-x:auto">
          <table class="data-table" *ngIf="pagedResult && pagedResult.items.length > 0">
            <thead>
              <tr>
                <th>Action</th>
                <th>Entity</th>
                <th>Entity ID</th>
                <th>User</th>
                <th>IP Address</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let log of pagedResult.items">
                <td>
                  <span class="badge" [class]="getActionBadge(log.action)">
                    {{ log.action }}
                  </span>
                </td>
                <td>{{ log.entityName }}</td>
                <td class="text-muted">{{ log.entityId || '-' }}</td>
                <td>{{ log.userName || 'System' }}</td>
                <td class="text-muted">{{ log.ipAddress || '-' }}</td>
                <td class="text-muted">{{ log.timestamp | timeAgo }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pagination-wrapper" *ngIf="pagedResult && pagedResult.totalPages > 1">
          <div class="pagination">
            <button class="pagination-btn" (click)="loadPage(currentPage - 1)"
                    [disabled]="currentPage <= 1">
              <span class="material-icons-round" style="font-size:16px">chevron_left</span>
            </button>
            <span style="font-size:0.85rem;color:var(--text-muted);padding:0 12px">
              Page {{ currentPage }} of {{ pagedResult.totalPages }}
            </span>
            <button class="pagination-btn" (click)="loadPage(currentPage + 1)"
                    [disabled]="currentPage >= pagedResult.totalPages">
              <span class="material-icons-round" style="font-size:16px">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .pagination-wrapper {
      display: flex;
      justify-content: center;
      padding: 16px;
      border-top: 1px solid var(--border-color);
    }
    .audit-summary {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 16px;
    }
    .stat-card {
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: var(--radius-md);
        padding: 16px;
        display: flex;
        align-items: center;
        gap: 16px;
    }
    .stat-icon {
        width: 40px; height: 40px;
        border-radius: var(--radius-sm);
        display: flex; align-items: center; justify-content: center;
    }
    .stat-details { display: flex; flex-direction: column; }
    .stat-value { font-size: 1.25rem; font-weight: 700; color: var(--text-primary); }
    .stat-label { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
    
    .badge-active { background: rgba(16,185,129,0.1); color: #10b981; }
    .badge-pending { background: rgba(245,158,11,0.1); color: #f59e0b; }
    .badge-expired { background: rgba(239,68,68,0.1); color: #ef4444; }
    .badge-cancelled { background: rgba(107,114,128,0.1); color: #6b7280; }
  `]
})
export class AuditLogsComponent implements OnInit {
    pagedResult: PagedResult<AuditLog> | null = null;
    summary: { [key: string]: number } | null = null;
    loading = true;
    currentPage = 1;

    constructor(private auditLogService: AuditLogService) { }

    ngOnInit(): void {
        this.loadPage(1);
        this.loadSummary();
    }

    loadSummary(): void {
        this.auditLogService.getSummary().subscribe(res => {
            this.summary = res.data;
        });
    }

    loadPage(page: number): void {
        this.loading = true;
        this.currentPage = page;
        this.auditLogService.getLogs(page, 20).subscribe({
            next: (res) => {
                this.pagedResult = res.data;
                this.loading = false;
            },
            error: () => { this.loading = false; }
        });
    }

    getActionBadge(action: string): string {
        switch (action.toLowerCase()) {
            case 'create': return 'badge-active';
            case 'update': return 'badge-pending';
            case 'delete': return 'badge-expired';
            case 'upload': return 'badge-active';
            case 'sync': return 'badge-pending';
            default: return 'badge-cancelled';
        }
    }

    getActionIcon(action: string): string {
        switch (action.toLowerCase()) {
            case 'create': return 'add_circle';
            case 'update': return 'edit';
            case 'delete': return 'delete';
            case 'upload': return 'upload_file';
            case 'sync': return 'sync';
            default: return 'info';
        }
    }
}
