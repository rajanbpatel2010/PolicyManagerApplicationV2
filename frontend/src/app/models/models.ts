// ═══════════════════════════════════════════════════════════════
//  TYPES & ENUMS
// ═══════════════════════════════════════════════════════════════

export type PolicyStatus = 'Active' | 'Pending' | 'Expired' | 'Cancelled' | 'Completed' | 'Lapsed';
export type InstallmentType = 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Yearly' | 'One Time';
export type UserRole = 'Admin' | 'User';

// ═══════════════════════════════════════════════════════════════
//  TYPESCRIPT INTERFACES / MODELS
// ═══════════════════════════════════════════════════════════════

export interface Policy {
    id: number;
    policyNumber: string;
    policyHolderName: string;
    email: string;
    phoneNumber?: string;
    policyTypeId: number;
    policyTypeName: string;
    premiumAmount: number;
    yearlyPremiumAmount?: number;
    coverageAmount?: number;
    totalPaidAmount?: number;
    startDate: string;
    endDate: string;
    status: PolicyStatus;
    description?: string;
    nomineeName?: string;
    nomineeRelation?: string;
    installmentType?: InstallmentType;
    nextInstallmentDate?: string;
    schemeName?: string;
    companyName?: string;
    productName?: string;
    locationUnit?: string;
    duration?: string;
    coverageDescription?: string;
    taxAmount?: number;
    gstApplicable?: string;
    installmentAmount?: number;
    netPremium?: number;
    bankAccountDetails?: string;
    agentName?: string;
    alternateContactNumber?: string;
    specialRemarks?: string;
    maturityDate?: string;
    totalMaturityAmount?: number;
    additionalDetails?: string;
    annuityDate?: string;
    annuityAmount?: number;
    autoDebit?: string;
    termYears?: string;
    payingTerm?: string;
    createdAt: string;
    updatedAt?: string;
    createdByName?: string;
    payments: Payment[];
    documents: PolicyDocument[];
    familyMemberId?: number;
    familyMemberName?: string;
    ageAtInception?: number;
}

export interface PolicyDocument {
    id: number;
    policyId: number;
    documentType: string;
    fileName: string;
    fileExtension: string;
    fileSize: number;
    createdAt: string;
    uploadedByName?: string;
}

export interface Payment {
    id: number;
    policyId: number;
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    transactionId?: string;
    notes?: string;
    createdAt: string;
    processedByName?: string;
}

export interface CreatePayment {
    policyId: number;
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    transactionId?: string;
    notes?: string;
}

export interface CreatePolicy {
    policyHolderName: string;
    email: string;
    phoneNumber?: string;
    policyTypeId: number;
    premiumAmount: number;
    coverageAmount?: number;
    totalPaidAmount?: number;
    startDate: string;
    endDate: string;
    description?: string;
    nomineeName?: string;
    nomineeRelation?: string;
    installmentType?: InstallmentType;
    nextInstallmentDate?: string;
    schemeName?: string;
    companyName?: string;
    productName?: string;
    locationUnit?: string;
    duration?: string;
    coverageDescription?: string;
    taxAmount?: number;
    gstApplicable?: string;
    installmentAmount?: number;
    netPremium?: number;
    bankAccountDetails?: string;
    agentName?: string;
    alternateContactNumber?: string;
    specialRemarks?: string;
    maturityDate?: string;
    totalMaturityAmount?: number;
    additionalDetails?: string;
    annuityDate?: string;
    annuityAmount?: number;
    autoDebit?: string;
    termYears?: string;
    payingTerm?: string;
    familyMemberId?: number;
}

export interface UpdatePolicy extends CreatePolicy {
    status: PolicyStatus;
}

export interface PolicyType {
    id: number;
    name: string;
    description?: string;
    isActive: boolean;
}

export interface User {
    id: number;
    fullName: string;
    email: string;
    role: UserRole;
    phoneNumber?: string;
    isActive: boolean;
    createdAt: string;
    lastLoginAt?: string;
}

export interface LoginRequest {
    email: string;
    password: string;
    rememberMe?: boolean;
}

export interface RegisterRequest {
    fullName: string;
    email: string;
    password: string;
    phoneNumber?: string;
}

export interface AuthResponse {
    token: string;
    fullName: string;
    email: string;
    role: UserRole;
    expiration: string;
}

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
    errors?: string[];
}

export interface PagedResult<T> {
    items: T[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
}

export interface PolicyFilter {
    searchTerm?: string;
    policyTypeIds?: number[];
    statuses?: string[];
    companyName?: string;
    startDateFrom?: string;
    startDateTo?: string;
    // Advanced Filters
    endDateFrom?: string;
    endDateTo?: string;
    installmentTypes?: string[];
    nextInstallmentFrom?: string;
    nextInstallmentTo?: string;
    premiumMin?: number;
    premiumMax?: number;
    hasOverdueInstallment?: boolean;
    familyMemberIds?: number[];
    createdByName?: string;
    sortBy?: string;
    sortDirection?: string;
    pageNumber?: number;
    pageSize?: number;
}

export interface Dashboard {
    totalPolicies: number;
    activePolicies: number;
    expiredPolicies: number;
    pendingPolicies: number;
    cancelledPolicies: number;
    totalPremiumAmount: number;
    totalCoverageAmount: number;
    totalPendingInstallments: number;
    totalPendingAmount: number;
    policyTypeCounts: PolicyTypeCount[];
    monthlyPolicies: MonthlyPolicy[];
    recentPolicies: Policy[];
    upcomingInstallments: UpcomingInstallment[];
    overdueCount: number;
    overdueAmount: number;
}

export interface PolicyTypeCount {
    policyTypeName: string;
    count: number;
    totalPremium: number;
}

export interface MonthlyPolicy {
    month: string;
    count: number;
}

export interface DashboardStats {
    currentMonthBudget: number;
    nextMonthBudget: number;
    currentFYBudget: number;
    currentFYIncome: number;
    nextYearForecast: number;
    oneTimeInvestmentTotal: number;
    oneTimeInvestmentCount: number;
    upcomingPremiumAmount: number;
    upcomingPremiumCount: number;
    forecastList: PolicyForecast[];
    monthlyForecasts: MonthlyForecast[];
    selectedMembers: string[];
}

export interface MonthlyForecast {
    month: string;
    totalAmount: number;
}

export interface PolicyForecast {
    policyName: string;
    policyNumber: string;
    memberName: string;
    ageAtInception: number;
    installmentAmount: number;
    nextInstallmentDate?: string;
    policyType: string;
    companyName?: string;
    productName?: string;
    status: string;
    premiumAmount: number;
    coverageAmount?: number;
    agentName?: string;
}

export interface FamilyMember {
    id: number;
    name: string;
    dateOfBirth: string;
    relationship: string;
    parentId?: number;
    parentName?: string;
    children?: FamilyMember[];
    // Policy summary (eagerly loaded)
    policyCount?: number;
    activePolicyCount?: number;
    totalPremium?: number;
    totalCoverage?: number;
    policies?: FamilyMemberPolicySummary[];
}

export interface FamilyMemberPolicySummary {
    id: number;
    policyNumber: string;
    policyTypeName: string;
    premiumAmount: number;
    coverageAmount?: number;
    status: string;
    nextInstallmentDate?: string;
    installmentType?: string;
    startDate: string;
    endDate: string;
    companyName?: string;
}

export interface CreateFamilyMember {
    name: string;
    dateOfBirth: string;
    relationship: string;
    parentId?: number;
}

export interface AuditLog {
    id: number;
    action: string;
    entityName: string;
    entityId?: number;
    oldValues?: string;
    newValues?: string;
    userName?: string;
    ipAddress?: string;
    timestamp: string;
}

export interface PolicyReminderSetting {
    id: number;
    policyTypeId: number;
    policyTypeName: string;
    isEnabled: boolean;
    daysBeforeDue: number;
    updatedAt?: string;
}

export interface UpdateReminderSetting {
    isEnabled: boolean;
    daysBeforeDue: number;
}

export interface UpcomingInstallment {
    policyId: number;
    policyNumber: string;
    policyHolderName: string;
    email?: string;
    policyTypeName: string;
    premiumAmount: number;
    coverageAmount?: number;
    totalPaidAmount?: number;
    installmentType?: InstallmentType;
    nextInstallmentDate?: string;
    startDate: string;
    endDate: string;
    daysUntilDue: number;
    isOverdue: boolean;
    status: PolicyStatus;
    urgencyLevel: string;
}

export interface SendTestEmail {
    policyId: number;
    recipientEmail?: string;
}

// ═══════════════════════════════════════════════════════════════
//  INVESTMENT FORECAST
// ═══════════════════════════════════════════════════════════════

export interface InvestmentForecast {
    fiscalYear: number;
    totalYearlyOutflow: number;
    totalExpectedMaturity: number;
    netPosition: number;
    totalPolicies: number;
    totalMutualFunds: number;
    monthlyBreakdown: MonthlyForecastDetail[];
    memberWiseSummary: MemberForecastSummary[];
}

export interface MonthlyForecastDetail {
    month: string;
    monthNumber: number;
    year: number;
    totalOutflow: number;
    totalMaturityIncome: number;
    installments: PolicyInstallmentDetail[];
}

export interface PolicyInstallmentDetail {
    policyId: number;
    mutualFundId?: number;
    policyNumber: string;
    memberName: string;
    policyTypeName: string;
    companyName?: string;
    productName?: string;
    amount: number;
    dueDate: string;
    installmentType: string;
    isPaid: boolean;
    status: string;
}

export interface MemberForecastSummary {
    memberId: number;
    memberName: string;
    relationship: string;
    policyCount: number;
    mutualFundCount: number;
    yearlyOutflow: number;
    yearlyMaturity: number;
}

export interface ForecastImpact {
    currentMonthlyAvg: number;
    newMonthlyAvg: number;
    monthlyChange: number;
    currentYearlyTotal: number;
    newYearlyTotal: number;
    impactSummary: string;
}

// ═══════════════════════════════════════════════════════════════
//  IN-APP NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════

export interface NotificationItem {
    id: number;
    title: string;
    message: string;
    type: 'Installment' | 'Expiry' | 'Payment' | 'System';
    policyId?: number;
    policyNumber?: string;
    isRead: boolean;
    createdAt: string;
    timeAgo: string;
}

export interface NotificationSummary {
    unreadCount: number;
    recent: NotificationItem[];
}

export interface RequestLoginHistory {
    id: number;
    email: string;
    loginTime: string;
    ipAddress?: string;
    isSuccess: boolean;
    failureReason?: string;
}
