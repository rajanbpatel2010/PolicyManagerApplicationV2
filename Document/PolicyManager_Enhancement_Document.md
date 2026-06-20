# PolicyManager Application — Advanced Enhancement & Design Review

**Document Version:** 2.0  
**Prepared for:** Development Team  
**Scope:** Architecture improvements, feature roadmap, design system upgrade, security hardening, and performance optimization

---

## Executive Summary

The existing PolicyManager application is a well-structured, full-stack insurance portfolio platform. The codebase demonstrates clean architecture principles, thoughtful UX patterns (glassmorphism, Angular standalone components, reactive state), and enterprise integration (Gemini AI, SMTP, background scheduling). This document identifies **critical gaps**, proposes **advanced feature layers**, and defines a **production-grade design system upgrade** to elevate the product to a premium, enterprise-ready application.

---

## Part 1 — Codebase Audit & Critical Issues

### 1.1 Security Vulnerabilities (Priority: Critical)

| Issue | Location | Risk | Fix |
|---|---|---|---|
| API keys hardcoded in config | `appsettings.json`, `Services.cs` | Credential leakage | Move to ASP.NET User Secrets + Azure Key Vault / environment variables |
| CORS wildcard not restricted | `Program.cs` configuration | XSS / CSRF attack surface | Restrict to known origins; enforce `SameSite=Strict` cookies |
| No rate limiting on auth endpoints | `/api/auth/login` | Brute-force attacks | Add `AspNetCoreRateLimit` middleware: 5 req/min on login |
| JWT stored in `localStorage` | `auth.service.ts` | XSS token theft | Migrate to `HttpOnly` cookies with refresh token rotation |
| No input sanitization layer | `PolicyService.cs` Excel import | CSV/formula injection | Strip leading `=`, `+`, `-`, `@` chars from all imported cells |
| Missing HTTPS redirect enforcement | `Program.cs` | Man-in-the-middle | Add `app.UseHttpsRedirection()` with HSTS headers |

### 1.2 Performance Bottlenecks

**Backend:**
- `DashboardService.GetStatsAsync` executes 6+ separate database round-trips. Consolidate into a single multi-result stored procedure or use `EF Core` compiled queries.
- `InvestmentForecastService.ProjectInstallments` runs in-memory loops over all policies — cache the result with `IDistributedCache` (Redis) keyed on `userId + fyYear + memberHash`, TTL 15 minutes.
- `UploadPoliciesFromExcelAsync` does per-row `AnyAsync` checks. Replace with a bulk upsert using `EFCore.BulkExtensions`.
- `AsNoTracking()` is missing on several read-only queries in `PolicyService.GetPoliciesAsync` sub-includes.

**Frontend:**
- `policy-list.component.ts` defaults `pageSize: 100` — loads 100 rows on every navigation. Default to 20, add virtual scrolling for large datasets using Angular CDK `ScrollingModule`.
- `NotificationService.startPolling()` uses `interval(60000)` without cleanup — this leaks subscriptions on logout. Add `takeUntil(destroy$)` pattern.
- Chart instances in `ForecastChartComponent` and `InvestmentForecastComponent` are destroyed/re-created on every data change. Use `chart.update()` instead of `chart.destroy()` + `new Chart()`.
- No lazy image loading or `@defer` blocks (Angular 17+) for off-screen dashboard sections.

### 1.3 Code Quality Issues

- **`Services.cs` is 1,100+ lines** containing 8 distinct service classes. Split into individual files: `PolicyService.cs`, `AuthService.cs`, `DashboardService.cs`, etc. This violates Single Responsibility Principle.
- **Magic strings everywhere:** `"Active"`, `"One Time"`, `"Admin"`, `"Monthly"` — centralize in a `PolicyConstants.cs` static class.
- **No global error boundary on frontend** — unhandled RxJS errors silently swallow failures. Add a global `ErrorHandler` class implementing Angular's `ErrorHandler` interface.
- **`FamilyMemberService.GetByIdAsync` returns `null!`** — this suppresses nullability warnings and will cause NullReferenceExceptions in production. Throw `KeyNotFoundException` instead.
- **`BiometricService`** imports `NativeBiometric` which only works on Capacitor native platforms, but is instantiated unconditionally — add a proper platform guard.

---

## Part 2 — Feature Enhancements (Advanced Layer)

### 2.1 AI Intelligence Upgrade

**Current State:** Single Gemini API call for document extraction.

**Enhancement: Agentic AI Pipeline**

Introduce a multi-step AI orchestration layer:

```
Document Upload
    → Step 1: Classification (Life/Health/Motor/General)
    → Step 2: Structured Extraction (existing Gemini call)
    → Step 3: Validation Agent (cross-check dates, premium range plausibility)
    → Step 4: Enrichment (auto-match CompanyName to known insurer database)
    → Step 5: Confidence Score (0–100) returned with each field
```

Implementation approach:
- Create `GeminiOrchestratorService` with `Task<PolicyExtractionResult> ExtractWithConfidenceAsync(byte[] document, string mimeType)`
- Return a `Dictionary<string, (string value, int confidence)>` per field
- Frontend shows a confidence badge (🟢 High / 🟡 Medium / 🔴 Low) next to each auto-filled field in the verification modal
- Fields below 70% confidence are highlighted in amber and require manual confirmation before form submission

**Enhancement: Natural Language Policy Query**

Add a `/api/policies/ask` endpoint powered by Gemini:

```
User types: "Show me all LIC policies expiring in the next 3 months for Ramesh"
System: Parses intent → builds PolicyFilterDto → returns structured results
```

Frontend: Add a command palette (`Cmd+K` / `Ctrl+K`) in the navbar with a natural language search input.

### 2.2 Advanced Analytics Dashboard

**New Module: Portfolio Health Score**

Replace basic stat cards with a computed `PortfolioHealthScore` (0–100):

```csharp
public class PortfolioHealthScoreService
{
    // Scoring factors:
    // Coverage adequacy vs income (life cover ≥ 10x annual income): 25 pts
    // Payment discipline (no overdue installments): 20 pts
    // Diversification (≥3 policy types): 15 pts
    // Nominee completeness (all policies have nominees): 15 pts
    // Document completeness: 10 pts
    // Renewal health (no policies expiring <30 days): 15 pts
    
    public async Task<HealthScoreResultDto> CalculateAsync(string[] memberNames);
}
```

Display as an animated radial gauge on the dashboard with per-factor breakdown.

**New Module: Tax Intelligence (India-specific)**

```csharp
public class TaxIntelligenceService
{
    // Section 80C: Sum of life insurance premiums (max ₹1.5L)
    // Section 80D: Health insurance premiums (₹25K / ₹50K for senior)
    // Section 10(10D): Maturity amount tax exemption check
    // HRA / ULIP deduction projection
    
    public async Task<TaxSummaryDto> GetCurrentFYTaxBenefitsAsync(string[] members);
}
```

Frontend: New `/tax-planner` route with a tax savings breakdown table and deduction optimizer suggestions.

**New Widget: Premium Calendar Heatmap**

A GitHub-contribution-style heatmap showing premium payment density across the year. Each cell = one calendar day, color intensity = total premium due that day. Click a cell to see which policies are due.

### 2.3 Smart Notifications & Reminders

**Current Gap:** Email-only, no escalation logic.

**Enhancement: Escalation Ladder**

```
Day 30: In-App notification + Email (standard)
Day 15: In-App + Email (warning tone)
Day 7:  In-App + Email + WhatsApp (if configured)
Day 3:  All channels + SMS
Day 0:  All channels + push notification + mark policy as "Action Required"
Day -1: Overdue alert to admin dashboard
```

**Enhancement: Smart Snooze**

Allow users to snooze a reminder from within the notification panel:
- "Remind me in 3 days"
- "I've paid — skip this cycle"
- "Stop reminders for this policy"

Implemented as `ReminderSnooze` table linked to `PolicyReminderEvent`.

**Enhancement: WhatsApp Integration**

Add `WhatsAppChannel` using the WhatsApp Business API (Meta):

```csharp
public class WhatsAppNotificationService : INotificationChannel
{
    // Uses Meta Graph API
    // Template-based messaging (pre-approved templates)
    // Sends policy number, due date, amount in structured message
}
```

### 2.4 Document Intelligence

**Enhancement: OCR + Document Classification**

Upgrade `ParsePolicyDocumentAsync` to handle scanned/image PDFs:
- Use Gemini 1.5 Pro's vision capability (already implemented) but add preprocessing
- Add a `DocumentClassifier` that detects: Policy Bond / Premium Receipt / Renewal Notice / Claim Form
- Store classified document type automatically on upload

**Enhancement: Policy Comparison Engine**

```
User selects 2-4 policies → Side-by-side comparison table
Fields: Premium, Coverage, Installment Type, Maturity, Returns, IRR, Tax Status
AI-generated "Which is better for you?" summary
```

New endpoint: `POST /api/policies/compare` accepting `int[] policyIds`

**Enhancement: Digital Locker Integration**

DigiLocker API integration (India) for fetching insurance documents directly from the government repository. Requires OAuth2 with DigiLocker authorization server.

### 2.5 Mobile App Enhancements (Capacitor)

**Enhancement: Biometric + PIN fallback**

Current `BiometricService` has no fallback for devices without biometrics. Add 4-digit PIN flow:
- Store PIN hash in Capacitor `SecureStorage` plugin
- Fallback authentication chain: Biometric → PIN → Password

**Enhancement: Offline Policy Creation**

Extend `OfflineStorageService` to support creating policies while offline:
- Queue creates/updates in `pending_sync` SQLite table
- Sync automatically when connectivity returns using Capacitor `Network` plugin listener
- Show sync status badge in navbar when pending items exist

**Enhancement: Widget Support (iOS/Android)**

Create a home screen widget showing:
- Next premium due (policy number, amount, days remaining)
- Current month budget remaining
- Portfolio health score

Implement using Capacitor community widget plugin.

### 2.6 Collaboration & Multi-User Features

**Enhancement: Family Member Access Control**

Currently all users see all policies. Add:
- `PolicyAccessControl` table: `PolicyId`, `UserId`, `AccessLevel` (View/Edit/Admin)
- Family members can have their own login with access only to their policies
- Head of family (Admin) has full access

**Enhancement: Advisor Portal**

A separate `Agent` role with:
- Read-only access to assigned clients' portfolios
- Ability to send reminders on behalf of the client
- Commission tracking per policy (`CommissionAmount`, `CommissionRate` fields)
- `/advisor/dashboard` with a client list view

**Enhancement: Audit Trail Enhancements**

Current audit log only stores action + old/new JSON. Add:
- IP geolocation (country/city from IP)
- Device fingerprint (user-agent parsed)
- Session ID linkage
- Diff view in the audit log UI (show exactly what changed, highlighted)

### 2.7 Financial Intelligence Upgrades

**Enhancement: IRR / XIRR Calculator**

For each investment policy, compute the true Internal Rate of Return:

```csharp
public class IrrCalculatorService
{
    // Uses Newton-Raphson method for XIRR computation
    // Input: Payment cashflows with dates, maturity cashflow
    // Output: IRR%, compared to benchmark (FD rates, Nifty 50 CAGR)
    public double CalculateXIRR(List<(DateTime date, decimal amount)> cashflows);
}
```

Display IRR on the policy detail page with a benchmark comparison: "Your LIC Jeevan Anand returns 5.2% vs FD average 6.8%."

**Enhancement: Maturity Tracker**

A dedicated `/maturity-tracker` page:
- Timeline view (horizontal scroll) of all upcoming maturities
- Shows maturity amount, current corpus value, remaining tenure
- Reinvestment suggestions (rule-based: "₹5L maturing in Mar 2026 — consider NPS Tier 1 or PPF top-up")

**Enhancement: Cash Flow Forecasting (5-Year)**

Extend `InvestmentForecastService` to project 5 years forward:
- Multi-FY projection with inflation adjustment toggle (CPI 6%)
- Shows net cash position per year
- Downloadable PDF report

---

## Part 3 — Architecture Upgrades

### 3.1 Backend Architecture

**Add CQRS Pattern with MediatR**

Refactor heavy service methods into commands and queries:

```
/Application
  /Policies
    /Queries
      GetPoliciesQuery.cs
      GetPoliciesQueryHandler.cs
    /Commands
      CreatePolicyCommand.cs
      CreatePolicyCommandHandler.cs
      MarkAsPaidCommand.cs
```

Benefits: Easier unit testing, clear separation of read/write models, enables event sourcing later.

**Add Domain Events**

```csharp
public class PolicyCreatedEvent : INotification
{
    public int PolicyId { get; set; }
    public string PolicyHolderName { get; set; }
}

// Handlers:
// → SendWelcomeEmailHandler
// → CreateDefaultReminderSettingsHandler
// → AuditLogHandler
```

**Add Response Caching**

```csharp
// Program.cs
builder.Services.AddResponseCaching();
builder.Services.AddMemoryCache();

// On frequently-read endpoints:
[ResponseCache(Duration = 300, VaryByQueryKeys = new[] { "fyYear", "members" })]
public async Task<IActionResult> GetForecast(...) { }
```

**Add Health Check Dashboard**

Extend existing health checks with:
- Gemini API connectivity
- SMTP server connectivity
- Disk space (for document uploads)
- Background scheduler status (last run timestamp)

Expose at `/health/detail` with a formatted HTML dashboard.

### 3.2 Frontend Architecture

**Add NgRx State Management**

Replace scattered `BehaviorSubject` patterns with NgRx Store for:
- `PolicyState` (current list, filters, selected policy)
- `AuthState` (user, token, roles)
- `NotificationState` (unread count, items)
- `DashboardState` (stats, selected members, forecast data)

Benefits: Time-travel debugging, predictable state, easier testing.

**Add Signal-based Reactivity (Angular 17+)**

Migrate component inputs and computed values to Signals:

```typescript
// Before
@Input() forecasts: PolicyForecast[] = [];

// After
forecasts = input<PolicyForecast[]>([]);
filteredForecasts = computed(() => 
  this.forecasts().filter(f => f.memberName === this.selectedMember())
);
```

**Add Error Boundary Pattern**

```typescript
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: any): void {
    // Log to Sentry / Application Insights
    // Show user-friendly toast
    // Route to /error page for critical failures
  }
}
```

**Add E2E Tests with Playwright**

```
/e2e
  /tests
    auth.spec.ts          // Login, register, logout
    policy-crud.spec.ts   // Create, read, update, delete
    excel-import.spec.ts  // Upload valid/invalid Excel files
    dashboard.spec.ts     // Stats load correctly
    reminders.spec.ts     // Scan + process cycle
```

### 3.3 Infrastructure

**Docker Compose Setup**

```yaml
version: '3.9'
services:
  api:
    build: ./backend/PolicyManager.API
    environment:
      - ConnectionStrings__Default=Server=db;...
      - GeminiApi__ApiKey=${GEMINI_API_KEY}
    depends_on: [db, redis]
    
  frontend:
    build: ./frontend
    ports: ["4200:80"]
    
  db:
    image: mcr.microsoft.com/mssql/server:2022-latest
    
  redis:
    image: redis:7-alpine
    
  seq:
    image: datalust/seq:latest    # Structured log viewer
    ports: ["5341:80"]
```

**CI/CD Pipeline (GitHub Actions)**

```yaml
# .github/workflows/deploy.yml
jobs:
  test-backend:
    - dotnet restore
    - dotnet build
    - dotnet test --coverage
    
  test-frontend:
    - npm ci
    - ng test --watch=false --browsers=ChromeHeadless
    - npx playwright test
    
  deploy:
    - docker build + push to registry
    - SSH deploy to server
    - Run DB migrations
    - Health check verification
```

---

## Part 4 — Design System Upgrade

### 4.1 Design Audit: Current Issues

| Issue | Impact | Fix |
|---|---|---|
| Inconsistent border-radius values (8px, 12px, 24px, 32px mixed arbitrarily) | Visual noise | Standardize to 3-step scale: sm=8px, md=16px, lg=28px |
| Purple gradient overuse — used on 15+ unrelated elements | Brand dilution | Reserve gradient for primary CTA only |
| Glassmorphism applied to every card including data tables | Readability issues | Reserve glass treatment for hero/overlay cards; use solid `--bg-card` for data |
| Typography scale is flat — body, labels, values all look similar in weight | Hierarchy confusion | Implement strict type scale with 5 levels |
| Color semantic inconsistency — `#ef4444` used for both danger AND outflow | Misleading | Separate semantic palette from data-viz palette |
| Mobile bottom nav icons are too small (24px) with no labels on active state | Accessibility fail | Increase to 28px; show label on active; minimum tap target 48px |
| Loading spinners are different across 6 components | Inconsistency | Create single `<app-spinner>` component |
| Empty states lack personality — just grey icons | Low engagement | Illustrate with contextual SVG spot illustrations |

### 4.2 New Design Token System

Replace the current ad-hoc variables with a structured, semantic token system:

```css
/* ─────────────────────────────────────────
   TIER 1: Primitive Tokens (never used directly in components)
   ───────────────────────────────────────── */
:root {
  /* Hue Palette */
  --hue-indigo-50:  #EEF2FF;
  --hue-indigo-100: #E0E7FF;
  --hue-indigo-400: #818CF8;
  --hue-indigo-500: #6366F1;
  --hue-indigo-600: #4F46E5;
  --hue-indigo-900: #1E1B4B;

  --hue-emerald-400: #34D399;
  --hue-emerald-500: #10B981;
  --hue-amber-400:   #FBBF24;
  --hue-rose-400:    #FB7185;
  --hue-rose-500:    #F43F5E;
  --hue-sky-400:     #38BDF8;
  
  /* Neutral (OLED-optimized) */
  --neutral-0:   #000000;
  --neutral-50:  #09090B;   /* True OLED black */
  --neutral-100: #18181B;   
  --neutral-150: #1F1F23;   
  --neutral-200: #27272A;   
  --neutral-300: #3F3F46;   
  --neutral-400: #52525B;   
  --neutral-500: #71717A;   
  --neutral-600: #A1A1AA;   
  --neutral-700: #D4D4D8;   
  --neutral-800: #E4E4E7;   
  --neutral-900: #FAFAFA;   
}

/* ─────────────────────────────────────────
   TIER 2: Semantic Tokens (used in components)
   ───────────────────────────────────────── */
:root {
  /* Backgrounds — strict 4-level elevation system */
  --bg-base:      var(--neutral-50);   /* Page background */
  --bg-surface:   var(--neutral-100);  /* Card default */
  --bg-elevated:  var(--neutral-150);  /* Dropdowns, tooltips */
  --bg-overlay:   var(--neutral-200);  /* Modals, sheets */
  --bg-input:     var(--neutral-150);  /* Form fields */
  --bg-hover:     rgba(255,255,255,0.04);
  --bg-selected:  rgba(99,102,241,0.12);

  /* Brand */
  --brand-primary:       var(--hue-indigo-500);
  --brand-primary-hover: var(--hue-indigo-600);
  --brand-primary-muted: rgba(99,102,241,0.15);
  --brand-on-primary:    #FFFFFF;
  
  /* Semantic Status */
  --status-success:      var(--hue-emerald-500);
  --status-success-bg:   rgba(16,185,129,0.10);
  --status-success-border: rgba(16,185,129,0.25);
  
  --status-warning:      var(--hue-amber-400);
  --status-warning-bg:   rgba(251,191,36,0.10);
  --status-warning-border: rgba(251,191,36,0.25);
  
  --status-danger:       var(--hue-rose-500);
  --status-danger-bg:    rgba(244,63,94,0.10);
  --status-danger-border: rgba(244,63,94,0.25);
  
  --status-info:         var(--hue-sky-400);
  --status-info-bg:      rgba(56,189,248,0.10);
  --status-info-border:  rgba(56,189,248,0.25);

  /* Data Visualization (separate from semantic!) */
  --data-outflow:   #F87171;   /* Red — premium payments */
  --data-inflow:    #4ADE80;   /* Green — maturity receipts */
  --data-forecast:  #818CF8;   /* Indigo — projections */
  --data-overdue:   #FB923C;   /* Orange — overdue items */
  --data-neutral:   #94A3B8;   /* Grey — neutral data */

  /* Typography */
  --text-primary:   var(--neutral-900);
  --text-secondary: var(--neutral-600);
  --text-muted:     var(--neutral-500);
  --text-disabled:  var(--neutral-400);
  --text-inverse:   var(--neutral-50);
  --text-brand:     var(--hue-indigo-400);

  /* Borders */
  --border-subtle:  rgba(255,255,255,0.04);
  --border-default: rgba(255,255,255,0.08);
  --border-strong:  rgba(255,255,255,0.15);
  --border-focus:   var(--hue-indigo-500);
  --border-danger:  var(--hue-rose-500);

  /* Spacing (8-point grid) */
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;

  /* Radius (3-level system — strict) */
  --radius-sm:   6px;    /* Badges, tags, small buttons */
  --radius-md:   10px;   /* Inputs, small cards */
  --radius-lg:   16px;   /* Cards, panels */
  --radius-xl:   24px;   /* Modals, hero cards */
  --radius-full: 9999px; /* Pills, circular buttons */

  /* Typography Scale */
  --text-xs:   0.6875rem;  /* 11px — labels, timestamps */
  --text-sm:   0.8125rem;  /* 13px — body small */
  --text-base: 0.9375rem;  /* 15px — body */
  --text-lg:   1.0625rem;  /* 17px — body large */
  --text-xl:   1.25rem;    /* 20px — subheadings */
  --text-2xl:  1.5rem;     /* 24px — section titles */
  --text-3xl:  1.875rem;   /* 30px — page titles */
  --text-4xl:  2.5rem;     /* 40px — hero numbers */
  --text-5xl:  3.5rem;     /* 56px — display */

  /* Font Weights */
  --weight-normal:   400;
  --weight-medium:   500;
  --weight-semibold: 600;
  --weight-bold:     700;
  --weight-extrabold: 800;

  /* Shadows (refined, direction-aware) */
  --shadow-xs:  0 1px 2px rgba(0,0,0,0.4);
  --shadow-sm:  0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3);
  --shadow-md:  0 4px 6px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.2);
  --shadow-lg:  0 10px 15px rgba(0,0,0,0.4), 0 4px 6px rgba(0,0,0,0.2);
  --shadow-xl:  0 20px 25px rgba(0,0,0,0.45), 0 10px 10px rgba(0,0,0,0.2);
  --shadow-brand: 0 8px 24px rgba(99,102,241,0.35);
  --shadow-inset: inset 0 1px 2px rgba(0,0,0,0.3);

  /* Transitions */
  --ease-out:    cubic-bezier(0.0, 0.0, 0.2, 1.0);
  --ease-in-out: cubic-bezier(0.4, 0.0, 0.2, 1.0);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1.0);
  --duration-fast:   120ms;
  --duration-base:   200ms;
  --duration-slow:   350ms;
  --duration-enter:  280ms;
  --duration-exit:   200ms;
}
```

### 4.3 Typography Upgrade

Replace Roboto/Inter with a premium pairing:

```css
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300..700;1,9..40,300..700&family=DM+Mono:wght@400;500&display=swap');

/* 
  DM Sans: Clean, geometric grotesque with warmth — perfect for dashboards
  DM Mono: Matching monospace for policy numbers, amounts, codes
*/

:root {
  --font-sans: 'DM Sans', -apple-system, system-ui, sans-serif;
  --font-mono: 'DM Mono', 'Cascadia Code', 'JetBrains Mono', monospace;
  --font-display: 'DM Sans', sans-serif; /* Use with weight 700+ */
}

body {
  font-family: var(--font-sans);
  font-optical-sizing: auto;
  font-feature-settings: "kern" 1, "liga" 1, "calt" 1, "cv01" 1;
}

/* Policy numbers, amounts — always monospace */
.policy-number,
.amount-value,
.premium-value,
code,
.metric-value {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
}
```

### 4.4 Component Library Specifications

#### Card Component (Revised)

```css
/* 3 card variants — no more ad-hoc glass everywhere */

/* Variant 1: Data Card (for tables, lists) */
.card-data {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  overflow: hidden;
  /* No glassmorphism — readability first */
}

/* Variant 2: Hero Card (stats, KPIs) */
.card-hero {
  background: linear-gradient(
    145deg,
    var(--bg-elevated) 0%,
    var(--bg-surface) 100%
  );
  border: 1px solid var(--border-default);
  border-radius: var(--radius-xl);
  backdrop-filter: blur(12px);
  box-shadow: var(--shadow-md);
  position: relative;
  overflow: hidden;
}

.card-hero::before {
  /* Subtle top-edge highlight for depth */
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(
    180deg,
    rgba(255,255,255,0.06) 0%,
    transparent 40%
  );
  pointer-events: none;
}

/* Variant 3: Glass Card (modals, sidebars, overlays only) */
.card-glass {
  background: rgba(24, 24, 27, 0.8);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl), inset 0 1px 0 rgba(255,255,255,0.05);
}
```

#### Button Component (Revised)

```css
/* 4 button variants with consistent anatomy */

.btn {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  letter-spacing: 0.01em;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: 0 var(--space-4);
  height: 36px;
  white-space: nowrap;
  transition:
    background var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-out);
  position: relative;
  user-select: none;
}

.btn:active:not(:disabled) { transform: scale(0.97); }
.btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* Primary — use for one primary action per view */
.btn-primary {
  background: var(--brand-primary);
  color: var(--brand-on-primary);
  box-shadow: var(--shadow-sm), 0 0 0 0 rgba(99,102,241,0);
}
.btn-primary:hover:not(:disabled) {
  background: var(--brand-primary-hover);
  box-shadow: var(--shadow-brand);
}

/* Secondary — use for secondary actions */
.btn-secondary {
  background: var(--bg-elevated);
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
}
.btn-secondary:hover:not(:disabled) {
  background: var(--bg-hover);
  color: var(--text-primary);
  border-color: var(--border-strong);
}

/* Ghost — use for tertiary/destructive inline actions */
.btn-ghost {
  background: transparent;
  color: var(--text-muted);
  border: 1px solid transparent;
}
.btn-ghost:hover:not(:disabled) {
  background: var(--bg-hover);
  color: var(--text-primary);
}

/* Danger — use sparingly, only for destructive actions */
.btn-danger {
  background: var(--status-danger-bg);
  color: var(--status-danger);
  border: 1px solid var(--status-danger-border);
}
.btn-danger:hover:not(:disabled) {
  background: var(--status-danger);
  color: white;
}

/* Sizes */
.btn-sm { height: 30px; padding: 0 var(--space-3); font-size: var(--text-xs); border-radius: var(--radius-sm); }
.btn-lg { height: 44px; padding: 0 var(--space-6); font-size: var(--text-base); border-radius: var(--radius-md); }
.btn-xl { height: 52px; padding: 0 var(--space-8); font-size: var(--text-lg); border-radius: var(--radius-lg); }

/* Icon-only */
.btn-icon {
  padding: 0;
  width: 36px;
  border-radius: var(--radius-md);
}
.btn-icon.btn-sm { width: 30px; }
.btn-icon.btn-lg { width: 44px; }
```

#### Badge / Status Chip

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 0 var(--space-2);
  height: 20px;
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  border-radius: var(--radius-sm);
  letter-spacing: 0.03em;
  text-transform: uppercase;
  /* Add dot indicator */
}

.badge::before {
  content: '';
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.7;
  flex-shrink: 0;
}

.badge-active   { background: var(--status-success-bg); color: var(--status-success); border: 1px solid var(--status-success-border); }
.badge-expired  { background: var(--status-danger-bg);  color: var(--status-danger);  border: 1px solid var(--status-danger-border); }
.badge-pending  { background: var(--status-warning-bg); color: var(--status-warning); border: 1px solid var(--status-warning-border); }
.badge-info     { background: var(--status-info-bg);    color: var(--status-info);    border: 1px solid var(--status-info-border); }
.badge-neutral  { background: var(--bg-elevated);       color: var(--text-muted);     border: 1px solid var(--border-default); }
```

#### Form Controls (Revised)

```css
.form-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.form-label {
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  color: var(--text-secondary);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  user-select: none;
}

.form-label .required {
  color: var(--status-danger);
  margin-left: 2px;
}

.form-control {
  font-family: var(--font-sans);
  font-size: var(--text-base);
  font-weight: var(--weight-normal);
  color: var(--text-primary);
  background: var(--bg-input);
  border: 1.5px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: 0 var(--space-3);
  height: 40px;
  width: 100%;
  outline: none;
  transition:
    border-color var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out),
    background var(--duration-fast) var(--ease-out);
}

.form-control::placeholder { color: var(--text-disabled); }

.form-control:hover:not(:disabled):not(:focus) {
  border-color: var(--border-strong);
}

.form-control:focus {
  border-color: var(--border-focus);
  background: var(--bg-surface);
  box-shadow: 0 0 0 3px rgba(99,102,241,0.18);
}

.form-control.ng-invalid.ng-touched {
  border-color: var(--status-danger);
  box-shadow: 0 0 0 3px rgba(244,63,94,0.15);
}

.form-hint {
  font-size: var(--text-xs);
  color: var(--text-muted);
  margin-top: 2px;
}

.form-error {
  font-size: var(--text-xs);
  color: var(--status-danger);
  margin-top: 2px;
  display: flex;
  align-items: center;
  gap: 4px;
}
```

#### Data Table (Revised)

```css
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}

.data-table thead {
  border-bottom: 1px solid var(--border-subtle);
}

.data-table th {
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  text-align: left;
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
  background: transparent;
  transition: color var(--duration-fast) var(--ease-out);
}

.data-table th:hover { color: var(--text-primary); }

.data-table th.sorted { color: var(--text-brand); }

.data-table tbody tr {
  border-bottom: 1px solid var(--border-subtle);
  transition: background var(--duration-fast) var(--ease-out);
}

.data-table tbody tr:hover {
  background: var(--bg-hover);
}

.data-table tbody tr.selected {
  background: var(--bg-selected);
}

.data-table td {
  padding: var(--space-3) var(--space-4);
  color: var(--text-secondary);
  vertical-align: middle;
}

.data-table td.td-primary {
  color: var(--text-primary);
  font-weight: var(--weight-medium);
}

.data-table td.td-mono {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--text-brand);
  letter-spacing: 0.02em;
}

/* Overdue row highlight */
.data-table tr.row-overdue {
  background: rgba(244,63,94,0.04);
  border-left: 2px solid var(--status-danger);
}

/* Due soon highlight */
.data-table tr.row-due-soon {
  background: rgba(251,191,36,0.04);
  border-left: 2px solid var(--status-warning);
}
```

### 4.5 Navigation Redesign

**Current Issue:** Desktop nav links look similar to each other with insufficient visual hierarchy.

**Proposed Redesign:**

```
Left Sidebar (collapsible, 240px → 64px)
├── Brand Logo + Name
├── Primary Nav
│   ├── 🏠 Dashboard         (active: filled highlight pill)
│   ├── 📋 Policies          (badge: unread count)
│   ├── 👨‍👩‍👧 Family Office
│   └── 📈 Forecast
├── ─ divider ─
├── Secondary Nav
│   ├── ⏰ Reminders         (admin only)
│   ├── 📧 Email Messenger   (admin only)
│   └── 🔍 Audit Logs        (admin only)
└── Bottom
    ├── 🔔 Notifications     (bell with count)
    ├── 👤 User avatar       (dropdown: Profile, Settings, Logout)
    └── ◀ Collapse toggle
```

Benefits over current top bar:
- More vertical real estate for content
- Better scalability as nav items grow
- Standard pattern for enterprise dashboards
- Easier mobile adaptation (slide-over drawer)

### 4.6 Dashboard Visual Redesign

**KPI Cards — From glass boxes to premium metric tiles:**

Each metric tile should have:
- Trend indicator (↑ +12% vs last month)
- Mini sparkline chart (7-day or 30-day history)
- Contextual color (not just purple for everything)
- Click → drill-down navigation

**Color assignment (consistent throughout app):**
- Monthly Budget: `--hue-indigo-500` (brand — primary action)
- Annual Outflow: `--hue-rose-500` (danger — money going out)
- Maturity Income: `--hue-emerald-500` (success — money coming in)
- One-Time Assets: `--hue-amber-400` (warning/special — investment)
- Portfolio Score: gradient based on score value (red → amber → green)

### 4.7 Empty State Design

Replace plain grey icons with contextual illustrations:

```typescript
// Component
@Component({
  selector: 'app-empty-state',
  template: `
    <div class="empty-state">
      <div class="empty-illustration">
        <ng-content select="[slot=illustration]"></ng-content>
      </div>
      <h3 class="empty-title">{{ title }}</h3>
      <p class="empty-description">{{ description }}</p>
      <div class="empty-actions">
        <ng-content select="[slot=actions]"></ng-content>
      </div>
    </div>
  `
})
export class EmptyStateComponent {
  @Input() title = 'Nothing here yet';
  @Input() description = '';
}
```

Context-specific messages:
- No policies: "Your policy vault is empty. Import from Excel or add your first policy."
- No family members: "Start by adding your family members to track coverage across the household."
- No notifications: "You're all caught up! No pending alerts."
- No payments: "No payment history recorded yet for this policy."

---

## Part 5 — Accessibility & Compliance

### 5.1 WCAG 2.1 AA Compliance Gaps

| Issue | Element | WCAG Criterion | Fix |
|---|---|---|---|
| Color alone used to convey status | Badge colors | 1.4.1 Use of Color | Add text label ("Active" not just green dot) |
| Contrast ratio < 4.5:1 | `var(--text-muted)` on `var(--bg-card)` | 1.4.3 Contrast | Darken muted text to #94a3b8 → #A8B3C5 minimum |
| No `aria-label` on icon buttons | All `.btn-icon` | 4.1.2 Name, Role, Value | Add `aria-label="Mark as paid"` etc. |
| Form fields missing `aria-describedby` for errors | All forms | 1.3.1 Info and Relationships | Link `.form-error` to input via `aria-describedby` |
| Chart data inaccessible to screen readers | Chart.js charts | 1.1.1 Non-text Content | Add `aria-label` with summary + data table toggle |
| Modal focus not trapped | All modals | 2.1.2 No Keyboard Trap | Implement `FocusTrap` directive using CDK |
| No skip-to-content link | All pages | 2.4.1 Bypass Blocks | Add `<a href="#main">Skip to content</a>` as first element |

### 5.2 Keyboard Navigation

Add keyboard shortcut system:
```
Ctrl+K       → Command palette (search/navigate)
N            → New policy (when not in input focus)
/            → Focus search bar
Esc          → Close modal/panel
→ / ←        → Navigate pagination
P            → Mark selected policy as paid
```

Implement via a `KeyboardShortcutService` with a `ShortcutHelpModal` (triggered by `?`).

---

## Part 6 — Testing Strategy

### 6.1 Backend Testing Targets

```
Unit Tests (xUnit + Moq):
  ✓ PolicyReminderScheduler — verify scan creates correct events
  ✓ InvestmentForecastService.ProjectInstallments — all installment types
  ✓ PolicyAnalysisService.CalculateBenefit — IRR, tax-exempt logic
  ✓ SyncAllInstallmentDatesAsync — One Time type handled correctly
  ✓ ExcelImport — malformed rows, duplicate policy numbers

Integration Tests (WebApplicationFactory):
  ✓ Auth flow (register → login → token validation → logout)
  ✓ Policy CRUD with audit log side effects
  ✓ Excel upload end-to-end
  ✓ Reminder scan + process cycle

Coverage Target: 80% line coverage minimum
```

### 6.2 Frontend Testing Targets

```
Unit Tests (Jest + Testing Library):
  ✓ InrCurrencyPipe — various amounts including edge cases
  ✓ ForecastListComponent — groupBy, filter, export logic
  ✓ AuthService — token storage, expiry check
  ✓ PolicyFilterDto → HttpParams conversion

Component Tests (Cypress Component Testing):
  ✓ PolicyFormComponent — validation, AI fill flow
  ✓ DashboardComponent — member filter interaction
  ✓ FamilyTreeComponent — tree build from flat data

E2E Tests (Playwright):
  ✓ Happy path: Login → Create Policy → Mark as Paid → View History
  ✓ Excel import → verify policy appears in list
  ✓ AI document scan → verify modal shows → confirm → form fills
  ✓ Reminder scan → check log appears
```

---

## Part 7 — Prioritized Implementation Roadmap

### Sprint 1 — Security & Stability (Week 1–2)
- [ ] Move secrets to User Secrets / environment variables
- [ ] Restrict CORS to production origins
- [ ] Add rate limiting on auth endpoints
- [ ] Fix `Services.cs` split into individual files
- [ ] Add `PolicyConstants.cs` for magic strings
- [ ] Add global Angular `ErrorHandler`
- [ ] Fix `FamilyMemberService.GetByIdAsync` null return

### Sprint 2 — Performance (Week 3–4)
- [ ] Consolidate Dashboard stats into single SP
- [ ] Add Redis distributed cache for Forecast endpoint
- [ ] Migrate policy list default pageSize to 20
- [ ] Fix notification service subscription leak
- [ ] Fix chart destroy/recreate pattern
- [ ] Add `EFCore.BulkExtensions` for Excel import

### Sprint 3 — Design System (Week 5–6)
- [ ] Implement new token system in `styles.css`
- [ ] Migrate to DM Sans font
- [ ] Replace all ad-hoc glass cards with 3-variant card system
- [ ] Implement new button system
- [ ] Implement new badge system
- [ ] Implement new form control system
- [ ] Add `EmptyStateComponent`
- [ ] Fix mobile nav tap targets

### Sprint 4 — Feature: Tax Intelligence (Week 7–8)
- [ ] `TaxIntelligenceService` backend
- [ ] Tax Planner frontend route
- [ ] 80C/80D/10(10D) calculations
- [ ] Downloadable tax summary report

### Sprint 5 — Feature: Portfolio Health Score (Week 9–10)
- [ ] `PortfolioHealthScoreService` backend
- [ ] Animated radial gauge component
- [ ] Per-factor breakdown UI
- [ ] Integration with dashboard

### Sprint 6 — Feature: AI Upgrade (Week 11–12)
- [ ] Multi-step AI extraction pipeline
- [ ] Confidence scoring per field
- [ ] Natural language query endpoint
- [ ] Command palette frontend (`Cmd+K`)

### Sprint 7 — Infrastructure (Week 13–14)
- [ ] Docker Compose setup
- [ ] GitHub Actions CI/CD pipeline
- [ ] Playwright E2E test suite
- [ ] xUnit test project with 80% coverage

### Sprint 8 — Advanced Features (Week 15–16)
- [ ] IRR/XIRR calculator
- [ ] WhatsApp notification channel
- [ ] 5-year forecast projection
- [ ] Accessibility audit + WCAG fixes

---

## Appendix A — API Versioning Strategy

Introduce API versioning before public/multi-tenant use:

```csharp
// Program.cs
builder.Services.AddApiVersioning(options => {
    options.DefaultApiVersion = new ApiVersion(1, 0);
    options.AssumeDefaultVersionWhenUnspecified = true;
    options.ReportApiVersions = true;
    options.ApiVersionReader = ApiVersionReader.Combine(
        new UrlSegmentApiVersionReader(),
        new HeaderApiVersionReader("X-Api-Version")
    );
});

// Controller
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/policies")]
```

---

## Appendix B — Recommended NuGet Packages

| Package | Purpose |
|---|---|
| `MediatR` | CQRS pattern |
| `EFCore.BulkExtensions` | Bulk Excel import |
| `AspNetCoreRateLimit` | Auth endpoint rate limiting |
| `Sentry.AspNetCore` | Error monitoring |
| `Polly` | HTTP resilience (Gemini API retries) |
| `CsvHelper` | Safer CSV export |
| `QuestPDF` | PDF report generation |
| `Hangfire` | Replace `IHostedService` scheduler with managed jobs |

---

## Appendix C — Recommended npm Packages

| Package | Purpose |
|---|---|
| `@ngrx/store` | State management |
| `@ngrx/effects` | Side effects |
| `d3` | Custom data visualizations |
| `@angular/cdk/a11y` | Focus trapping, accessibility |
| `@sentry/angular` | Frontend error monitoring |
| `date-fns` | Replace raw Date manipulations |
| `zod` | Runtime type validation for API responses |

---

*End of Document — PolicyManager Advanced Enhancement & Design Review v2.0*
