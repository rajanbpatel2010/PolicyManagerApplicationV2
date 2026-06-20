import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/models';
import { ConfigService } from './config.service';

export interface IrrAnalysisDto {
  policyId: number;
  policyNumber: string;
  irrPercentage: number;
  totalInvested: number;
  totalExpectedReturn: number;
  recommendation: string;
  cashFlows: CashFlowDto[];
}

export interface CashFlowDto {
  date: string;
  amount: number;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class FinanceService {
  private get apiUrl() { return `${this.config.getApiUrl()}/finance`; }

  constructor(private http: HttpClient, private config: ConfigService) { }

  getPortfolioIrr(): Observable<ApiResponse<IrrAnalysisDto[]>> {
    return this.http.get<ApiResponse<IrrAnalysisDto[]>>(`${this.apiUrl}/portfolio-irr`);
  }

  getPolicyIrr(id: number): Observable<ApiResponse<IrrAnalysisDto>> {
    return this.http.get<ApiResponse<IrrAnalysisDto>>(`${this.apiUrl}/policy-irr/${id}`);
  }
}
