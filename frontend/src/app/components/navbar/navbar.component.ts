import { Component, OnInit, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { NotificationItem } from '../../models/models';

@Component({
    selector: 'app-navbar',
    standalone: true,
    imports: [CommonModule, RouterLink, RouterLinkActive],
    template: `
    <nav class="navbar desktop-nav" *ngIf="authService.isAuthenticated()">
      <div class="nav-container">
        <a routerLink="/dashboard" class="nav-brand">
          <span class="material-icons-round brand-icon">shield</span>
          <span class="brand-text">Policy<span class="brand-accent">Manager</span></span>
        </a>

        <div class="nav-links">
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-link"
             [routerLinkActiveOptions]="{exact: true}">
            <span class="material-icons-round">dashboard</span>
            <span>Dashboard</span>
          </a>
          <a routerLink="/policies" routerLinkActive="active" class="nav-link">
            <span class="material-icons-round">description</span>
            <span>Policies</span>
          </a>
          <a routerLink="/family-members" routerLinkActive="active" class="nav-link">
            <span class="material-icons-round">groups</span>
            <span>Family</span>
          </a>
          <a routerLink="/investment-forecast" routerLinkActive="active" class="nav-link">
            <span class="material-icons-round">trending_up</span>
            <span>Forecast</span>
          </a>
          <a routerLink="/tax-planner" routerLinkActive="active" class="nav-link">
            <span class="material-icons-round">request_quote</span>
            <span>Tax</span>
          </a>
          <a routerLink="/finance-insights" routerLinkActive="active" class="nav-link">
            <span class="material-icons-round">insights</span>
            <span>Yield (ICC)</span>
          </a>
          <a routerLink="/intelligence-ai" routerLinkActive="active" class="nav-link">
            <span class="material-icons-round">auto_awesome</span>
            <span>Intelligence AI</span>
          </a>
        </div>

        <div class="nav-user">
          <div class="notification-bell-wrapper">
            <button class="btn-icon notification-bell" 
                    (click)="toggleNotifications($event)"
                    aria-label="Toggle notifications"
                    [attr.aria-expanded]="showNotifications"
                    aria-haspopup="true">
              <span class="material-icons-round">notifications</span>
              <span class="badge-count" *ngIf="unreadCount > 0" aria-hidden="true">{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
            </button>
            <div class="notification-panel" *ngIf="showNotifications" (click)="$event.stopPropagation()" role="dialog" aria-label="Notifications panel">
               <!-- Notification content as before -->
               <div class="panel-header">
                <h4>Notifications</h4>
                <button class="btn-text-sm" (click)="markAllRead()" *ngIf="unreadCount > 0">Mark all read</button>
              </div>
              <div class="panel-body custom-scrollbar">
                <div *ngFor="let n of notifications" class="notif-item" [class.unread]="!n.isRead" (click)="onNotifClick(n)">
                  <div class="notif-icon-wrap" [ngClass]="'notif-' + n.type.toLowerCase()">
                    <span class="material-icons-round">{{ getNotifIcon(n.type) }}</span>
                  </div>
                  <div class="notif-content">
                    <div class="notif-title">{{ n.title }}</div>
                    <div class="notif-msg">{{ n.message }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="user-info">
            <span class="user-avatar">{{ getInitials() }}</span>
          </div>
          <button class="btn btn-icon nav-refresh" (click)="refresh()" aria-label="Refresh Screen" title="Refresh">
            <span class="material-icons-round">refresh</span>
          </button>
          <button class="btn btn-icon nav-logout" (click)="logout()" aria-label="Log out of system" title="Logout">
            <span class="material-icons-round">logout</span>
          </button>
        </div>
      </div>
    </nav>

    <!-- 📱 Mobile Top Bar (Shown only on mobile) -->
    <nav class="mobile-top-bar" *ngIf="authService.isAuthenticated()">
      <div class="nav-brand">
        <span class="material-icons-round brand-icon">shield</span>
        <span class="brand-text">Policy<span class="brand-accent">Manager</span></span>
      </div>
      <div class="nav-user">
        <button class="btn-icon nav-refresh" (click)="refresh()" aria-label="Refresh Screen">
          <span class="material-icons-round">refresh</span>
        </button>
        <div class="notification-bell-wrapper">
          <button class="btn-icon notification-bell" 
                  (click)="toggleNotifications($event)"
                  aria-label="Toggle notifications"
                  [attr.aria-expanded]="showNotifications"
                  aria-haspopup="true">
            <span class="material-icons-round">notifications</span>
            <span class="badge-count" *ngIf="unreadCount > 0" aria-hidden="true">{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
          </button>
          <!-- Mobile Notification Panel -->
          <div class="notification-panel" *ngIf="showNotifications" (click)="$event.stopPropagation()" role="dialog" aria-label="Notifications panel">
            <div class="panel-header">
              <h4>Notifications</h4>
              <button class="btn-text-sm" (click)="markAllRead()" *ngIf="unreadCount > 0">Mark all read</button>
            </div>
            <div class="panel-body custom-scrollbar">
              <div *ngFor="let n of notifications" class="notif-item" [class.unread]="!n.isRead" (click)="onNotifClick(n)">
                <div class="notif-icon-wrap" [ngClass]="'notif-' + n.type.toLowerCase()">
                  <span class="material-icons-round">{{ getNotifIcon(n.type) }}</span>
                </div>
                <div class="notif-content">
                  <div class="notif-title">{{ n.title }}</div>
                  <div class="notif-msg">{{ n.message }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <button class="btn btn-icon nav-logout" (click)="logout()">
          <span class="material-icons-round">logout</span>
        </button>
      </div>
    </nav>

    <nav class="mobile-bottom-nav" *ngIf="authService.isAuthenticated()">
      <a routerLink="/dashboard" routerLinkActive="active" class="mobile-nav-link" [routerLinkActiveOptions]="{exact: true}">
        <span class="material-icons-round">dashboard</span>
        <span>Home</span>
      </a>
      <a routerLink="/policies" routerLinkActive="active" class="mobile-nav-link">
        <span class="material-icons-round">description</span>
        <span>Policies</span>
      </a>
      <a routerLink="/tax-planner" routerLinkActive="active" class="mobile-nav-link">
        <span class="material-icons-round">request_quote</span>
        <span>Tax</span>
      </a>
      <a routerLink="/finance-insights" routerLinkActive="active" class="mobile-nav-link">
        <span class="material-icons-round">insights</span>
        <span>Yield</span>
      </a>
      <a routerLink="/intelligence-ai" routerLinkActive="active" class="mobile-nav-link">
        <span class="material-icons-round">auto_awesome</span>
        <span>Intelligence</span>
      </a>
    </nav>
  `,
    styles: [`
    .navbar {
      position: fixed;
      top: 0; left: 0; right: 0;
      height: 70px;
      background: var(--navbar-bg);
      backdrop-filter: blur(var(--glass-blur));
      -webkit-backdrop-filter: blur(var(--glass-blur));
      border-bottom: 1px solid var(--border-subtle);
      z-index: 1000;
      padding-top: var(--safe-area-top);
    }

    .desktop-nav { display: block; }
    .nav-container {
      max-width: 1400px;
      margin: 0 auto;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 var(--space-lg);
    }

    .nav-brand {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      text-decoration: none;
    }
    .brand-icon {
      font-size: 32px;
      background: linear-gradient(135deg, var(--p-indigo-100), var(--p-indigo-500));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .brand-text {
      color: var(--text-main);
      font-size: 1.25rem;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .brand-accent { color: var(--action-primary); }

    .nav-links {
      display: flex;
      gap: 4px;
      padding: 4px;
    }
    .nav-link {
      display: flex;
      align-items: center;
      gap: var(--space-xs);
      padding: 8px 16px;
      color: var(--text-muted);
      border-radius: var(--radius-sm);
      font-size: 0.9rem;
      font-weight: 600;
      transition: all var(--t-fast);
      white-space: nowrap;
    }
    .nav-link span.material-icons-round { font-size: 20px; }
    .nav-link:hover { color: var(--text-main); background: rgba(255, 255, 255, 0.05); }
    .nav-link.active {
      color: var(--action-primary-text);
      background: var(--action-primary);
    }

    .nav-user {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .notification-bell-wrapper { position: relative; }
    .notification-bell {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #94a3b8;
      transition: 0.3s;
    }
    .notification-bell:hover { background: rgba(255, 255, 255, 0.1); color: white; }
    .badge-count {
      position: absolute;
      top: 6px; right: 6px;
      background: var(--color-danger);
      color: white;
      font-size: 10px;
      min-width: 16px; height: 16px;
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      border: 2px solid #1c1b1f;
    }

    .user-avatar {
      width: 40px; height: 40px;
      background: linear-gradient(135deg, var(--color-primary-dark), var(--color-primary));
      color: white;
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700;
      font-size: 0.85rem;
    }

    .nav-logout {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
      border: 1px solid rgba(239, 68, 68, 0.2);
    }
    .nav-logout:hover {
      background: #ef4444;
      color: white;
    }

    .notification-panel {
      position: absolute;
      top: 60px; right: 0;
      width: 320px;
      background: var(--bg-card);
      backdrop-filter: blur(20px);
      border: 1px solid var(--glass-border);
      border-radius: 20px;
      box-shadow: var(--shadow-lg);
      z-index: 2000;
      overflow: hidden;
    }
    .desktop-nav { display: block; }
    .mobile-top-bar { display: none; }
    .mobile-bottom-nav { display: none; }

    /* ── Mobile Bottom Nav (Android Style) ── */
    @media (max-width: 768px) {
      .desktop-nav { display: none; }
      
      .mobile-top-bar {
        display: flex;
        position: fixed;
        top: 0; left: 0; right: 0;
        height: calc(64px + var(--safe-area-top));
        background: rgba(28, 27, 31, 0.95);
        backdrop-filter: blur(20px);
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        z-index: 2000;
        padding: var(--safe-area-top) 16px 0;
        align-items: center;
        justify-content: space-between;
      }

      .mobile-bottom-nav {
        display: flex;
        position: fixed;
        bottom: 0; left: 0; right: 0;
        height: calc(80px + var(--safe-area-bottom));
        background: #2B2930; /* M3 Surface Container */
        border-top: 1px solid rgba(255, 255, 255, 0.05);
        z-index: 2000;
        padding-bottom: var(--safe-area-bottom);
        align-items: center;
        justify-content: space-around;
        box-shadow: 0 -4px 20px rgba(0,0,0,0.4);
      }

      .mobile-nav-link {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        color: #938F99; /* M3 On-Surface Variant */
        text-decoration: none;
        font-size: 0.7rem;
        font-weight: 500;
        transition: all 0.2s;
        flex: 1;
      }

      .mobile-nav-link span.material-icons-round {
        font-size: 24px;
        padding: 4px 16px;
        border-radius: 16px;
        transition: all 0.2s;
      }

      .mobile-nav-link.active {
        color: #D0BCFF; /* M3 Primary */
      }

      .mobile-nav-link.active span.material-icons-round {
        background: #4F378B; /* M3 Secondary Container */
        color: #EADDFF;
      }

      /* Floating Action Button for 'New Policy' */
      .fab-link {
        position: relative;
        top: -20px;
      }
      .nav-fab {
        width: 56px;
        height: 56px;
        background: #6750A4; /* M3 Primary */
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        box-shadow: 0 4px 12px rgba(103, 80, 164, 0.4);
        transition: transform 0.2s;
      }
      .nav-fab:active { transform: scale(0.9); }
      .nav-fab span { font-size: 32px !important; }
    }

  `]
})
export class NavbarComponent implements OnInit {
    currentUser = this.authService.getCurrentUser();
    showNotifications = false;
    unreadCount = 0;
    notifications: NotificationItem[] = [];

    constructor(
        public authService: AuthService,
        private router: Router,
        private notificationService: NotificationService,
        private elRef: ElementRef
    ) {
        this.authService.currentUser$.subscribe(user => {
            this.currentUser = user;
        });
    }

    ngOnInit(): void {
        if (this.authService.isAuthenticated()) {
            this.notificationService.startPolling();
            this.notificationService.summary$.subscribe(summary => {
                this.unreadCount = summary.unreadCount;
                this.notifications = summary.recent;
            });
        }
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: Event): void {
        if (!this.elRef.nativeElement.querySelector('.notification-bell-wrapper')?.contains(event.target)) {
            this.showNotifications = false;
        }
    }

    toggleNotifications(event: Event): void {
        event.stopPropagation();
        this.showNotifications = !this.showNotifications;
    }

    getNotifIcon(type: string): string {
        switch (type) {
            case 'Installment': return 'payments';
            case 'Expiry': return 'event_busy';
            case 'Payment': return 'check_circle';
            case 'System': return 'info';
            default: return 'notifications';
        }
    }

    onNotifClick(notif: NotificationItem): void {
        if (!notif.isRead) {
            this.notificationService.markAsRead(notif.id).subscribe();
            notif.isRead = true;
            this.unreadCount = Math.max(0, this.unreadCount - 1);
        }
        this.showNotifications = false;
        if (notif.policyId) {
            this.router.navigate(['/policies', notif.policyId]);
        }
    }

    dismissNotif(event: Event, notif: NotificationItem): void {
        event.stopPropagation();
        this.notificationService.dismiss(notif.id).subscribe();
        this.notifications = this.notifications.filter(n => n.id !== notif.id);
        if (!notif.isRead) {
            this.unreadCount = Math.max(0, this.unreadCount - 1);
        }
    }

    markAllRead(): void {
        this.notificationService.markAllRead().subscribe(() => {
            this.notifications.forEach(n => n.isRead = true);
            this.unreadCount = 0;
        });
    }

    getInitials(): string {
        if (!this.currentUser?.fullName) return '?';
        return this.currentUser.fullName
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    }

    refresh(): void {
        window.location.reload();
    }

    logout(): void {
        this.authService.logout();
        this.router.navigate(['/login']);
    }
}
