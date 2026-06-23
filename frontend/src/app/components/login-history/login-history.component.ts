import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { RequestLoginHistory } from '../../models/models';

@Component({
    selector: 'app-login-history',
    standalone: true,
    imports: [CommonModule, DatePipe],
    template: `
        <div class="page-container fade-in">
            <div class="page-header">
                <div class="header-content">
                    <h1 class="page-title">Login History</h1>
                    <p class="page-subtitle">View recent login attempts across the system.</p>
                </div>
            </div>

            <div class="card p-0 overflow-hidden">
                <div class="table-responsive">
                    <table class="table modern-table">
                        <thead>
                            <tr>
                                <th>Date & Time</th>
                                <th>Email</th>
                                <th>IP Address</th>
                                <th>Status</th>
                                <th>Failure Reason</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr *ngFor="let record of history">
                                <td>{{ record.loginTime | date:'medium' }}</td>
                                <td>{{ record.email }}</td>
                                <td><span class="badge badge-outline">{{ record.ipAddress || 'Unknown' }}</span></td>
                                <td>
                                    <span class="status-badge" [ngClass]="record.isSuccess ? 'status-active' : 'status-expired'">
                                        <span class="material-icons-round status-icon">{{ record.isSuccess ? 'check_circle' : 'error' }}</span>
                                        {{ record.isSuccess ? 'Success' : 'Failed' }}
                                    </span>
                                </td>
                                <td class="text-muted">{{ record.failureReason || '-' }}</td>
                            </tr>
                            <tr *ngIf="history.length === 0">
                                <td colspan="5" class="empty-state">
                                    <div class="empty-content">
                                        <span class="material-icons-round empty-icon">history</span>
                                        <h4>No Login History Found</h4>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .page-container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 32px 24px;
            animation: fadeIn 0.4s ease-out;
        }
        
        .page-header {
            margin-bottom: 24px;
        }
        
        .page-title {
            font-size: 2rem;
            font-weight: 800;
            color: var(--text-main);
            margin: 0;
            letter-spacing: -0.5px;
        }

        .page-subtitle {
            color: var(--text-muted);
            margin: 8px 0 0 0;
            font-size: 1rem;
        }

        .card {
            background: var(--bg-card);
            border-radius: 16px;
            border: 1px solid var(--border-subtle);
            box-shadow: var(--shadow-sm);
        }

        .table-responsive {
            overflow-x: auto;
        }

        .modern-table {
            width: 100%;
            border-collapse: collapse;
        }

        .modern-table th {
            background: rgba(255, 255, 255, 0.02);
            padding: 16px;
            text-align: left;
            font-size: 0.85rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--text-muted);
            border-bottom: 1px solid var(--border-subtle);
            white-space: nowrap;
        }

        .modern-table td {
            padding: 16px;
            vertical-align: middle;
            border-bottom: 1px solid var(--border-subtle);
            color: var(--text-main);
            font-size: 0.95rem;
        }

        .modern-table tbody tr {
            transition: background 0.2s;
        }

        .modern-table tbody tr:hover {
            background: rgba(255, 255, 255, 0.02);
        }

        .modern-table tbody tr:last-child td {
            border-bottom: none;
        }

        .badge-outline {
            background: transparent;
            border: 1px solid var(--border-subtle);
            color: var(--text-muted);
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 0.8rem;
            font-family: monospace;
        }

        .status-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 600;
        }

        .status-icon {
            font-size: 16px;
        }

        .status-active {
            background: rgba(34, 197, 94, 0.1);
            color: #22c55e;
            border: 1px solid rgba(34, 197, 94, 0.2);
        }

        .status-expired {
            background: rgba(239, 68, 68, 0.1);
            color: #ef4444;
            border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .text-muted {
            color: var(--text-muted);
        }

        .empty-state {
            padding: 64px 24px;
            text-align: center;
        }

        .empty-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 16px;
        }

        .empty-icon {
            font-size: 48px;
            color: var(--text-muted);
            opacity: 0.5;
        }

        .empty-content h4 {
            margin: 0;
            color: var(--text-main);
            font-size: 1.25rem;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `]
})
export class LoginHistoryComponent implements OnInit {
    history: RequestLoginHistory[] = [];

    constructor(private authService: AuthService) {}

    ngOnInit(): void {
        this.loadHistory();
    }

    loadHistory(): void {
        this.authService.getLoginHistory().subscribe(res => {
            if (res.success) {
                this.history = res.data;
            }
        });
    }
}
