import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, PolicyReminderSetting, UpdateReminderSetting } from '../models/models';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class ReminderService {
  private get apiUrl() { return `${this.config.getApiUrl()}/reminders`; }

  constructor(private http: HttpClient, private config: ConfigService) {}

  getSettings(): Observable<ApiResponse<PolicyReminderSetting[]>> {
    return this.http.get<ApiResponse<PolicyReminderSetting[]>>(`${this.apiUrl}/settings`);
  }

  updateSetting(id: number, setting: UpdateReminderSetting): Observable<ApiResponse<PolicyReminderSetting>> {
    return this.http.put<ApiResponse<PolicyReminderSetting>>(`${this.apiUrl}/settings/${id}`, setting);
  }

  getLogs(count: number = 20): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/logs?count=${count}`);
  }

  runScan(): Observable<ApiResponse<number>> {
    return this.http.post<ApiResponse<number>>(`${this.apiUrl}/run-scan`, {});
  }

  processPending(): Observable<ApiResponse<number>> {
    return this.http.post<ApiResponse<number>>(`${this.apiUrl}/process-pending`, {});
  }

  sendManual(dto: any): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/manual`, dto);
  }
}
