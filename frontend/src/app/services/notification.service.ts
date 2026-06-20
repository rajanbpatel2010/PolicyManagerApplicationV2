import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, interval, switchMap, startWith } from 'rxjs';
import { ApiResponse, NotificationSummary } from '../models/models';
import { ConfigService } from './config.service';

@Injectable({ providedIn: 'root' })
export class NotificationService {
    private get apiUrl() { return `${this.config.getApiUrl()}/notifications`; }
    private pollingIntervalMs = 60000; // 60 seconds — configurable

    private _summary$ = new BehaviorSubject<NotificationSummary>({ unreadCount: 0, recent: [] });
    public summary$ = this._summary$.asObservable();

    constructor(private http: HttpClient, private config: ConfigService) {}

    private pollingSubscription?: any;

    /** Start polling for notifications. Call once from navbar/app component. */
    startPolling(): void {
        if (this.pollingSubscription) return; // Already polling

        this.pollingSubscription = interval(this.pollingIntervalMs).pipe(
            startWith(0),
            switchMap(() => this.getNotifications())
        ).subscribe({
            next: (res) => {
                if (res.data) {
                    this._summary$.next(res.data);
                }
            },
            error: () => {} // Silently ignore polling errors
        });
    }

    stopPolling(): void {
        if (this.pollingSubscription) {
            this.pollingSubscription.unsubscribe();
            this.pollingSubscription = undefined;
        }
    }

    getNotifications(): Observable<ApiResponse<NotificationSummary>> {
        return this.http.get<ApiResponse<NotificationSummary>>(this.apiUrl);
    }

    markAsRead(id: number): Observable<ApiResponse<boolean>> {
        return this.http.put<ApiResponse<boolean>>(`${this.apiUrl}/${id}/read`, {});
    }

    markAllRead(): Observable<ApiResponse<boolean>> {
        return this.http.put<ApiResponse<boolean>>(`${this.apiUrl}/read-all`, {});
    }

    dismiss(id: number): Observable<ApiResponse<boolean>> {
        return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/${id}`);
    }

    get unreadCount(): number {
        return this._summary$.value.unreadCount;
    }
}
