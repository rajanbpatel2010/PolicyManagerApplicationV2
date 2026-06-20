import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/models';
import { ConfigService } from './config.service';

export interface TaxIntelligence {
  total80CDeduction: number;
  total80DDeduction: number;
  remaining80CLimit: number;
  remaining80DLimit: number;
  opportunities: TaxSavingOpportunity[];
  deductions: TaxDeductionBreakdown[];
}

export interface TaxDeductionBreakdown {
  section: string;
  category: string;
  holderName: string;
  amount: number;
  policyNumber: string;
}

export interface TaxSavingOpportunity {
  title: string;
  description: string;
  section: string;
  potentialSavings: number;
}

@Injectable({
  providedIn: 'root'
})
export class TaxService {
  private get apiUrl() { return `${this.config.getApiUrl()}/tax`; }

  constructor(private http: HttpClient, private config: ConfigService) { }

  getTaxPlanning(): Observable<ApiResponse<TaxIntelligence>> {
    return this.http.get<ApiResponse<TaxIntelligence>>(`${this.apiUrl}/planning`);
  }
}
