import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import {
    ApiResponse, AuthResponse, LoginRequest, RegisterRequest,
    User, RequestLoginHistory
} from '../models/models';
import { ConfigService } from './config.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly TOKEN_KEY = 'pm_token';
    private readonly USER_KEY = 'pm_user';
    private currentUserSubject = new BehaviorSubject<AuthResponse | null>(this.getStoredUser());

    currentUser$ = this.currentUserSubject.asObservable();

    constructor(private http: HttpClient, private config: ConfigService) { }

    login(credentials: LoginRequest): Observable<ApiResponse<AuthResponse>> {
        return this.http
            .post<ApiResponse<AuthResponse>>(`${this.config.getApiUrl()}/auth/login`, credentials)
            .pipe(tap(res => {
                if (res.success && res.data) {
                    this.storeAuth(res.data, !!credentials.rememberMe);
                }
            }));
    }

    register(data: RegisterRequest): Observable<ApiResponse<AuthResponse>> {
        return this.http
            .post<ApiResponse<AuthResponse>>(`${this.config.getApiUrl()}/auth/register`, data)
            .pipe(tap(res => {
                if (res.success && res.data) {
                    this.storeAuth(res.data, false);
                }
            }));
    }

    getProfile(): Observable<ApiResponse<User>> {
        return this.http.get<ApiResponse<User>>(`${this.config.getApiUrl()}/auth/profile`);
    }

    getLoginHistory(): Observable<ApiResponse<RequestLoginHistory[]>> {
        return this.http.get<ApiResponse<RequestLoginHistory[]>>(`${this.config.getApiUrl()}/auth/login-history`);
    }

    logout(): void {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        sessionStorage.removeItem(this.TOKEN_KEY);
        sessionStorage.removeItem(this.USER_KEY);
        this.currentUserSubject.next(null);
    }

    getToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY) || sessionStorage.getItem(this.TOKEN_KEY);
    }

    isAuthenticated(): boolean {
        const token = this.getToken();
        if (!token) return false;

        const user = this.getStoredUser();
        if (!user) return false;

        return new Date(user.expiration) > new Date();
    }

    isAdmin(): boolean {
        const user = this.getStoredUser();
        return user?.role === 'Admin';
    }

    getCurrentUser(): AuthResponse | null {
        return this.currentUserSubject.value;
    }

    private storeAuth(auth: AuthResponse, rememberMe: boolean): void {
        const storage = rememberMe ? localStorage : sessionStorage;
        
        // Clear alternate storage to avoid confusion
        const otherStorage = rememberMe ? sessionStorage : localStorage;
        otherStorage.removeItem(this.TOKEN_KEY);
        otherStorage.removeItem(this.USER_KEY);

        storage.setItem(this.TOKEN_KEY, auth.token);
        storage.setItem(this.USER_KEY, JSON.stringify(auth));
        this.currentUserSubject.next(auth);
    }

    private getStoredUser(): AuthResponse | null {
        const data = localStorage.getItem(this.USER_KEY) || sessionStorage.getItem(this.USER_KEY);
        return data ? JSON.parse(data) : null;
    }
}
