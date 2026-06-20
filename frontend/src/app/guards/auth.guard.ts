import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isAuthenticated()) {
        // Check for admin-only routes
        if (route.data?.['adminOnly'] && !authService.isAdmin()) {
            router.navigate(['/dashboard']);
            return false;
        }
        return true;
    }

    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
};

export const loginGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isAuthenticated()) {
        router.navigate(['/dashboard']);
        return false;
    }
    return true;
};
