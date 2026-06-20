import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

/**
 * Attaches the JWT Bearer token to outgoing requests.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const token = authService.getToken();

    if (token) {
        req = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
    }

    return next(req);
};

/**
 * Global HTTP error handler — shows toast messages and handles 401 redirects.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const router = inject(Router);
    const authService = inject(AuthService);
    const toast = inject(ToastService);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            let errorMessage = 'An unexpected error occurred';

            switch (error.status) {
                case 0:
                    errorMessage = 'Unable to connect to the server. Please check your connection.';
                    break;
                case 400:
                    errorMessage = error.error?.message || 'Invalid request. Please check your input.';
                    break;
                case 401:
                    errorMessage = 'Session expired. Please login again.';
                    authService.logout();
                    router.navigate(['/login']);
                    break;
                case 403:
                    errorMessage = 'You do not have permission to perform this action.';
                    break;
                case 404:
                    errorMessage = error.error?.message || 'The requested resource was not found.';
                    break;
                case 409:
                    errorMessage = error.error?.message || 'A conflict occurred.';
                    break;
                case 500:
                    errorMessage = 'Server error. Please try again later.';
                    break;
                default:
                    errorMessage = error.error?.message || errorMessage;
            }

            toast.error(errorMessage);
            return throwError(() => error);
        })
    );
};
