import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, FamilyMember, CreateFamilyMember, Policy } from '../models/models';
import { ConfigService } from './config.service';

@Injectable({ providedIn: 'root' })
export class FamilyMemberService {
    private get baseUrl() { return `${this.config.getApiUrl()}/familyMembers`; }

    constructor(private http: HttpClient, private config: ConfigService) { }

    getAll(): Observable<ApiResponse<FamilyMember[]>> {
        return this.http.get<ApiResponse<FamilyMember[]>>(this.baseUrl);
    }

    getById(id: number): Observable<ApiResponse<FamilyMember>> {
        return this.http.get<ApiResponse<FamilyMember>>(`${this.baseUrl}/${id}`);
    }

    getMemberPolicies(memberId: number): Observable<ApiResponse<Policy[]>> {
        return this.http.get<ApiResponse<Policy[]>>(`${this.baseUrl}/${memberId}/policies`);
    }

    create(member: CreateFamilyMember): Observable<ApiResponse<FamilyMember>> {
        return this.http.post<ApiResponse<FamilyMember>>(this.baseUrl, member);
    }

    update(id: number, member: CreateFamilyMember): Observable<ApiResponse<FamilyMember>> {
        return this.http.put<ApiResponse<FamilyMember>>(`${this.baseUrl}/${id}`, member);
    }

    delete(id: number): Observable<ApiResponse<boolean>> {
        return this.http.delete<ApiResponse<boolean>>(`${this.baseUrl}/${id}`);
    }
}
