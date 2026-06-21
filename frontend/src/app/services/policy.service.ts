import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HttpEvent, HttpEventType } from '@angular/common/http';
import {
    ApiResponse, PagedResult, Policy, CreatePolicy, UpdatePolicy,
    PolicyFilter, PolicyType, Dashboard, AuditLog, Payment, CreatePayment,
    PolicyDocument, UpcomingInstallment, SendTestEmail, DashboardStats
} from '../models/models';
import { ConfigService } from './config.service';

@Injectable({ providedIn: 'root' })
export class PolicyService {
    private get baseUrl() { return `${this.config.getApiUrl()}/policies`; }

    constructor(private http: HttpClient, private config: ConfigService) { }

    getPolicies(filter: PolicyFilter): Observable<ApiResponse<PagedResult<Policy>>> {
        const params = this.toHttpParams(filter);
        return this.http.get<ApiResponse<PagedResult<Policy>>>(this.baseUrl, { params });
    }

    private toHttpParams(obj: any): HttpParams {
        let params = new HttpParams();
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const value = obj[key];
                if (value !== null && value !== undefined && value !== '') {
                    if (Array.isArray(value)) {
                        value.forEach(v => params = params.append(key, v.toString()));
                    } else {
                        params = params.set(key, value.toString());
                    }
                }
            }
        }
        return params;
    }

    getPolicyById(id: number): Observable<ApiResponse<Policy>> {
        return this.http.get<ApiResponse<Policy>>(`${this.baseUrl}/${id}`);
    }

    createPolicy(policy: CreatePolicy): Observable<ApiResponse<Policy>> {
        return this.http.post<ApiResponse<Policy>>(this.baseUrl, policy);
    }

    updatePolicy(id: number, policy: UpdatePolicy): Observable<ApiResponse<Policy>> {
        return this.http.put<ApiResponse<Policy>>(`${this.baseUrl}/${id}`, policy);
    }

    deletePolicy(id: number): Observable<ApiResponse<boolean>> {
        return this.http.delete<ApiResponse<boolean>>(`${this.baseUrl}/${id}`);
    }

    uploadExcel(file: File): Observable<HttpEvent<any>> {
        const formData = new FormData();
        formData.append('file', file, file.name);
        return this.http.post<ApiResponse<any>>(`${this.baseUrl}/upload`, formData, {
            reportProgress: true,
            observe: 'events'
        });
    }

    getMyPolicies(): Observable<ApiResponse<Policy[]>> {
        return this.http.get<ApiResponse<Policy[]>>(`${this.baseUrl}/my-policies`);
    }

    markAsPaid(id: number, payment: CreatePayment): Observable<ApiResponse<Policy>> {
        return this.http.post<ApiResponse<Policy>>(`${this.baseUrl}/${id}/pay`, payment);
    }

    getPaymentHistory(id: number): Observable<ApiResponse<Payment[]>> {
        return this.http.get<ApiResponse<Payment[]>>(`${this.baseUrl}/${id}/payments`);
    }

    getPolicyHistory(id: number): Observable<ApiResponse<AuditLog[]>> {
        return this.http.get<ApiResponse<AuditLog[]>>(`${this.baseUrl}/${id}/history`);
    }

    syncInstallments(): Observable<ApiResponse<number>> {
        return this.http.post<ApiResponse<number>>(`${this.baseUrl}/sync-installments`, {});
    }

    getSyncPreview(): Observable<ApiResponse<any[]>> {
        return this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/sync-preview`);
    }

    uploadDocument(policyId: number, file: File, type: string = 'Policy'): Observable<ApiResponse<PolicyDocument>> {
        const formData = new FormData();
        formData.append('file', file, file.name);
        return this.http.post<ApiResponse<PolicyDocument>>(`${this.baseUrl}/${policyId}/documents?type=${type}`, formData);
    }

    parseDocument(file: File): Observable<ApiResponse<CreatePolicy>> {
        const formData = new FormData();
        formData.append('file', file, file.name);
        return this.http.post<ApiResponse<CreatePolicy>>(`${this.baseUrl}/parse-document`, formData);
    }

    getDownloadUrl(documentId: number): string {
        return `${this.baseUrl}/documents/${documentId}`;
    }

    exportToCsv(filter: PolicyFilter): Observable<Blob> {
        const params = this.toHttpParams(filter);
        return this.http.get(`${this.baseUrl}/export`, {
            params,
            responseType: 'blob'
        });
    }

    downloadTemplate(): Observable<Blob> {
        return this.http.get(`${this.baseUrl}/template`, {
            responseType: 'blob'
        });
    }

    getUpcomingInstallments(daysAhead: number = 30): Observable<ApiResponse<UpcomingInstallment[]>> {
        const params = new HttpParams().set('daysAhead', daysAhead.toString());
        return this.http.get<ApiResponse<UpcomingInstallment[]>>(
            `${this.baseUrl}/upcoming-installments`, { params }
        );
    }

    sendTestEmail(dto: SendTestEmail): Observable<ApiResponse<boolean>> {
        return this.http.post<ApiResponse<boolean>>(`${this.baseUrl}/send-test-email`, dto);
    }
}

@Injectable({ providedIn: 'root' })
export class PolicyTypeService {
    private get baseUrl() { return `${this.config.getApiUrl()}/policyTypes`; }

    constructor(private http: HttpClient, private config: ConfigService) { }

    getAll(): Observable<ApiResponse<PolicyType[]>> {
        return this.http.get<ApiResponse<PolicyType[]>>(this.baseUrl);
    }

    getById(id: number): Observable<ApiResponse<PolicyType>> {
        return this.http.get<ApiResponse<PolicyType>>(`${this.baseUrl}/${id}`);
    }

    create(type: Partial<PolicyType>): Observable<ApiResponse<PolicyType>> {
        return this.http.post<ApiResponse<PolicyType>>(this.baseUrl, type);
    }
}


@Injectable({ providedIn: 'root' })
export class DashboardService {
    private get baseUrl() { return `${this.config.getApiUrl()}/dashboard`; }
    constructor(private http: HttpClient, private config: ConfigService) { }

    getDashboard(holderName?: string): Observable<ApiResponse<Dashboard>> {
        let params = new HttpParams();
        if (holderName) params = params.set('holderName', holderName);
        return this.http.get<ApiResponse<Dashboard>>(this.baseUrl, { params });
    }

    getStats(members: string[] = []): Observable<ApiResponse<DashboardStats>> {
        let params = new HttpParams();
        if (members.length > 0) {
            params = params.set('members', members.join(','));
        } else {
            params = params.set('members', 'All');
        }
        return this.http.get<ApiResponse<DashboardStats>>(`${this.baseUrl}/stats`, { params });
    }
}

@Injectable({ providedIn: 'root' })
export class AuditLogService {
    constructor(private http: HttpClient, private config: ConfigService) { }

    getLogs(page: number = 1, pageSize: number = 20): Observable<ApiResponse<PagedResult<AuditLog>>> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('pageSize', pageSize.toString());
        return this.http.get<ApiResponse<PagedResult<AuditLog>>>(`${this.config.getApiUrl()}/auditLogs`, { params });
    }

    getSummary(): Observable<ApiResponse<{ [key: string]: number }>> {
        return this.http.get<ApiResponse<{ [key: string]: number }>>(`${this.config.getApiUrl()}/auditLogs/summary`);
    }
}
