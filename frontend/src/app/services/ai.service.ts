import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/models';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private get apiUrl() { return `${this.config.getApiUrl()}/ai`; }

  constructor(private http: HttpClient, private config: ConfigService) { }

  queryPortfolio(query: string): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.apiUrl}/query`, JSON.stringify(query), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
