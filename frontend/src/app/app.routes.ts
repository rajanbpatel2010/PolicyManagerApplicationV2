import { Routes } from '@angular/router';
import { authGuard, loginGuard } from './guards/auth.guard';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
    },
    {
        path: 'login',
        canActivate: [loginGuard],
        loadComponent: () =>
            import('./components/login/login.component').then(m => m.LoginComponent)
    },
    {
        path: 'register',
        canActivate: [loginGuard],
        loadComponent: () =>
            import('./components/register/register.component').then(m => m.RegisterComponent)
    },
    {
        path: 'dashboard',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent)
    },
    {
        path: 'family-members',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./components/family-members/family-members.component').then(m => m.FamilyMembersComponent)
    },
    {
        path: 'investment-forecast',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./components/investment-forecast/investment-forecast.component').then(m => m.InvestmentForecastComponent)
    },
    {
        path: 'one-time-investments',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./components/one-time-investment/one-time-investment.component').then(m => m.OneTimeInvestmentComponent)
    },
    {
        path: 'tax-planner',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./components/tax-planner/tax-planner.component').then(m => m.TaxPlannerComponent)
    },
    {
        path: 'intelligence-ai',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./components/intelligence-ai/intelligence-ai.component').then(m => m.IntelligenceAiComponent)
    },
    {
        path: 'finance-insights',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./components/finance-insights/finance-insights.component').then(m => m.FinanceInsightsComponent)
    },
    {
        path: 'policies',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./components/policy-list/policy-list.component').then(m => m.PolicyListComponent)
    },
    {
        path: 'policies/new',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./components/policy-form/policy-form.component').then(m => m.PolicyFormComponent)
    },
    {
        path: 'policies/:id',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./components/policy-detail/policy-detail.component').then(m => m.PolicyDetailComponent)
    },
    {
        path: 'policies/:id/edit',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./components/policy-form/policy-form.component').then(m => m.PolicyFormComponent)
    },
    {
        path: 'audit-logs',
        canActivate: [authGuard],
        data: { adminOnly: true },
        loadComponent: () =>
            import('./components/audit-logs/audit-logs.component').then(m => m.AuditLogsComponent)
    },
    {
        path: 'reminders',
        canActivate: [authGuard],
        data: { adminOnly: true },
        loadComponent: () =>
            import('./components/reminder-settings/reminder-settings.component').then(m => m.ReminderSettingsComponent)
    },
    {
        path: 'reminders/messenger',
        canActivate: [authGuard],
        data: { adminOnly: true },
        loadComponent: () =>
            import('./components/manual-email-messenger/manual-email-messenger.component').then(m => m.ManualEmailMessengerComponent)
    },
    {
        path: '**',
        redirectTo: 'dashboard'
    }
];
