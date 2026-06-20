import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, InvestmentForecast, ForecastImpact, Policy } from '../models/models';
import { ConfigService } from './config.service';

@Injectable({ providedIn: 'root' })
export class InvestmentForecastService {
    private get apiUrl() { return `${this.config.getApiUrl()}/investmentForecast`; }

    constructor(private http: HttpClient, private config: ConfigService) {}

    getForecast(year?: number, members: string[] = []): Observable<ApiResponse<InvestmentForecast>> {
        let params = new HttpParams();
        if (year) params = params.set('year', year.toString());
        if (members.length > 0) {
            params = params.set('members', members.join(','));
        } else {
            params = params.set('members', 'All');
        }
        return this.http.get<ApiResponse<InvestmentForecast>>(this.apiUrl, { params });
    }

    getForecastImpact(policy: Partial<Policy>, members: string[] = []): Observable<ApiResponse<ForecastImpact>> {
        let params = new HttpParams();
        if (members.length > 0) {
            params = params.set('members', members.join(','));
        } else {
            params = params.set('members', 'All');
        }
        return this.http.post<ApiResponse<ForecastImpact>>(`${this.apiUrl}/impact`, policy, { params });
    }
}
