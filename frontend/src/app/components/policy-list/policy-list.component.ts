import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import * as XLSX from 'xlsx';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { OfflineStorageService } from '../../services/offline-storage.service';
import { PolicyService, PolicyTypeService } from '../../services/policy.service';
import { Policy, PolicyType, PolicyFilter, PagedResult, FamilyMember } from '../../models/models';
import { FamilyMemberService } from '../../services/family-member.service';
import { InrCurrencyPipe, TimeAgoPipe, TruncateTextPipe } from '../../pipes/pipes';
import { SpinnerComponent } from '../shared/spinner/spinner.component';
import { EmptyStateComponent } from '../shared/empty-state/empty-state.component';


@Component({
  selector: 'app-policy-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, InrCurrencyPipe, TimeAgoPipe, TruncateTextPipe, DragDropModule, SpinnerComponent, EmptyStateComponent],
  template: `
    <div class="page-container" cdkDropListGroup>
      <div class="page-header">
        <!-- Top Section: Title & Stats -->
        <div class="header-top">
          <div class="header-main">
            <h1 class="page-title-compact">
              Policies
              <span class="offline-badge" *ngIf="isOffline">Offline</span>
            </h1>
            <p class="page-subtitle">Track and manage your insurance portfolio</p>
          </div>

          <div class="stats-summary-grid-compact">
            <div class="stat-card-mini glass-card">
              <div class="stat-icon-sm premium"><span class="material-icons-round">payments</span></div>
              <div class="stat-info">
                <span class="stat-label">Annual Premium</span>
                <span class="stat-value-sm">{{ stats.totalPremium | inrCurrency }}</span>
              </div>
            </div>
            <div class="stat-card-mini glass-card">
              <div class="stat-icon-sm active"><span class="material-icons-round">verified</span></div>
              <div class="stat-info">
                <span class="stat-label">Active</span>
                <span class="stat-value-sm">{{ stats.activeCount }}</span>
              </div>
            </div>
            <div class="stat-card-mini glass-card" [class.warning]="stats.expiringSoon > 0">
              <div class="stat-icon-sm expiry"><span class="material-icons-round">event_busy</span></div>
              <div class="stat-info">
                <span class="stat-label">Expiring (30d)</span>
                <span class="stat-value-sm">{{ stats.expiringSoon }}</span>
              </div>
            </div>
            <div class="stat-card-mini glass-card upcoming-card" [class.highlight]="stats.upcomingPremium > 0">
              <div class="stat-icon-sm upcoming"><span class="material-icons-round">pending_actions</span></div>
              <div class="stat-info">
                <span class="stat-label">Upcoming Premium (FY)</span>
                <span class="stat-value-sm">{{ stats.upcomingPremium | inrCurrency }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Bottom Section: Actions & Grouping (The Toolbar) -->
        <div class="header-bottom">
          <div class="header-actions desktop-only">
            <div class="column-selector-wrapper">
              <button class="btn btn-secondary" (click)="toggleColumnSelector()">
                <span class="material-icons-round">view_column</span>
                Columns
              </button>
              <div class="column-dropdown glass-card" *ngIf="showColumnSelector">
                <div class="column-option" *ngFor="let col of columns">
                  <label>
                    <input type="checkbox" [(ngModel)]="col.visible" (change)="onColumnVisibilityChange()">
                    {{ col.label }}
                  </label>
                </div>
              </div>
            </div>
            <button class="btn btn-secondary" (click)="downloadTemplate()" title="Template">
              <span class="material-icons-round">download</span>
              Template
            </button>
            <button class="btn btn-secondary" (click)="excelInput.click()" [disabled]="uploadingExcel" title="Import Excel">
              <span class="material-icons-round" *ngIf="!uploadingExcel">upload_file</span>
              <span class="spinner sm" *ngIf="uploadingExcel"></span>
              Import
            </button>
            <input type="file" #excelInput style="display:none" (change)="onExcelSelected($event)" accept=".xlsx, .xls">
            
            <button class="btn btn-secondary" (click)="exportToExcel()" [disabled]="loadingExport" title="Export Selected Columns">
              <span class="material-icons-round" *ngIf="!loadingExport">table_view</span>
              <span class="spinner sm" *ngIf="loadingExport"></span>
              Export Excel
            </button>
            
            <button class="btn btn-secondary" (click)="syncInstallments()" title="Sync Due Dates">
              <span class="material-icons-round">sync</span>
              Sync Due Dates
            </button>
            
            <button class="btn btn-primary" routerLink="/policies/new" *ngIf="authService.isAdmin()">
              <span class="material-icons-round">add</span>
              New Policy
            </button>
          </div>
        </div>
      </div>
      <div class="mb-lg">
        <div class="group-drop-area" 
              [class.active]="groupByField"
              cdkDropList 
              id="policyGroupingList"
              (cdkDropListDropped)="onColumnDropped($event)">
          <div class="d-flex align-center gap-sm">
            <span class="material-icons-round" [style.color]="groupByField ? 'var(--color-primary-light)' : 'var(--text-muted)'">
              {{ groupByField ? 'layers' : 'low_priority' }}
            </span>
            <span class="drop-text">
              {{ groupByField ? 'Grouped by: ' + getColumnLabel(groupByField) : 'Drag a column header here to group' }}
            </span>
          </div>
          <button class="btn-icon-sm" *ngIf="groupByField" (click)="clearGrouping()" title="Clear Grouping">
            <span class="material-icons-round">close</span>
          </button>
        </div>
      </div>
      <!-- Android-style Search & Filter Bar -->
      <div class="search-filter-bar glass-card mb-lg">
        <div class="search-input-wrap">
          <span class="material-icons-round search-icon">search</span>
          <input type="text" class="form-control-minimal" placeholder="Search policies..."
                 [(ngModel)]="filter.searchTerm" (input)="onSearch()">
          <button class="btn-icon-sm" (click)="showAdvancedFilters = !showAdvancedFilters" [class.active]="activeAdvancedFilterCount > 0">
            <span class="material-icons-round">tune</span>
          </button>
        </div>

        <!-- Advanced Filters (Collapsible) -->
        <div class="advanced-filters-panel" *ngIf="showAdvancedFilters">
          <div class="filter-grid">

            <!-- Policy Type Multi-Select -->
            <div class="filter-item">
              <label>Policy Type</label>
              <div class="multi-select-wrapper" (clickOutside)="closeDropdown('policyType')">
                <div class="multi-select-trigger" (click)="toggleDropdown('policyType')" [class.active]="openDropdown === 'policyType'">
                  <span class="trigger-text">{{ getSelectionLabel(filter.policyTypeIds, policyTypes, 'id', 'name', 'All Types') }}</span>
                  <span class="material-icons-round trigger-arrow">expand_more</span>
                </div>
                <div class="multi-select-dropdown" *ngIf="openDropdown === 'policyType'">
                  <div class="ms-search"><input type="text" placeholder="Search..." [(ngModel)]="dropdownSearch.policyType" (click)="$event.stopPropagation()"></div>
                  <div class="ms-options">
                    <label class="ms-option" *ngFor="let t of filteredPolicyTypes">
                      <input type="checkbox" [checked]="isSelected(filter.policyTypeIds, t.id)" (change)="toggleArrayItem(filter, 'policyTypeIds', t.id); loadPolicies()">
                      <span>{{ t.name }}</span>
                    </label>
                  </div>
                  <div class="ms-footer" *ngIf="filter.policyTypeIds?.length">
                    <button class="ms-clear" (click)="filter.policyTypeIds = []; loadPolicies()">Clear</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Status Multi-Select -->
            <div class="filter-item">
              <label>Status</label>
              <div class="multi-select-wrapper" (clickOutside)="closeDropdown('status')">
                <div class="multi-select-trigger" (click)="toggleDropdown('status')" [class.active]="openDropdown === 'status'">
                  <span class="trigger-text">{{ getSelectionLabelFromList(filter.statuses, allStatuses, 'All Status') }}</span>
                  <span class="material-icons-round trigger-arrow">expand_more</span>
                </div>
                <div class="multi-select-dropdown" *ngIf="openDropdown === 'status'">
                  <div class="ms-options">
                    <label class="ms-option" *ngFor="let s of allStatuses">
                      <input type="checkbox" [checked]="isSelected(filter.statuses, s)" (change)="toggleArrayItem(filter, 'statuses', s); loadPolicies()">
                      <span class="status-dot" [class]="'dot-' + s.toLowerCase()"></span>
                      <span>{{ s }}</span>
                    </label>
                  </div>
                  <div class="ms-footer" *ngIf="filter.statuses?.length">
                    <button class="ms-clear" (click)="filter.statuses = []; loadPolicies()">Clear</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Installment Type Multi-Select -->
            <div class="filter-item">
              <label>Installment Type</label>
              <div class="multi-select-wrapper" (clickOutside)="closeDropdown('installment')">
                <div class="multi-select-trigger" (click)="toggleDropdown('installment')" [class.active]="openDropdown === 'installment'">
                  <span class="trigger-text">{{ getSelectionLabelFromList(filter.installmentTypes, allInstallmentTypes, 'Any Type') }}</span>
                  <span class="material-icons-round trigger-arrow">expand_more</span>
                </div>
                <div class="multi-select-dropdown" *ngIf="openDropdown === 'installment'">
                  <div class="ms-options">
                    <label class="ms-option" *ngFor="let it of allInstallmentTypes">
                      <input type="checkbox" [checked]="isSelected(filter.installmentTypes, it)" (change)="toggleArrayItem(filter, 'installmentTypes', it); loadPolicies()">
                      <span>{{ it }}</span>
                    </label>
                  </div>
                  <div class="ms-footer" *ngIf="filter.installmentTypes?.length">
                    <button class="ms-clear" (click)="filter.installmentTypes = []; loadPolicies()">Clear</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Family Member Multi-Select -->
            <div class="filter-item">
              <label>Family Member</label>
              <div class="multi-select-wrapper" (clickOutside)="closeDropdown('family')">
                <div class="multi-select-trigger" (click)="toggleDropdown('family')" [class.active]="openDropdown === 'family'">
                  <span class="trigger-text">{{ getSelectionLabel(filter.familyMemberIds, familyMembers, 'id', 'name', 'All Members') }}</span>
                  <span class="material-icons-round trigger-arrow">expand_more</span>
                </div>
                <div class="multi-select-dropdown" *ngIf="openDropdown === 'family'">
                  <div class="ms-search"><input type="text" placeholder="Search..." [(ngModel)]="dropdownSearch.family" (click)="$event.stopPropagation()"></div>
                  <div class="ms-options">
                    <label class="ms-option" *ngFor="let m of filteredFamilyMembers">
                      <input type="checkbox" [checked]="isSelected(filter.familyMemberIds, m.id)" (change)="toggleArrayItem(filter, 'familyMemberIds', m.id); loadPolicies()">
                      <span>{{ m.name }}</span>
                    </label>
                  </div>
                  <div class="ms-footer" *ngIf="filter.familyMemberIds?.length">
                    <button class="ms-clear" (click)="filter.familyMemberIds = []; loadPolicies()">Clear</button>
                  </div>
                </div>
              </div>
            </div>

            <div class="filter-item">
              <label>Company</label>
              <input type="text" class="form-control" placeholder="Insurance Co." [(ngModel)]="filter.companyName" (input)="onSearch()">
            </div>
            <div class="filter-item">
              <label>Start Date From</label>
              <input type="date" class="form-control" [(ngModel)]="filter.startDateFrom" (change)="loadPolicies()">
            </div>
            <div class="filter-item">
              <label>End Date Before</label>
              <input type="date" class="form-control" [(ngModel)]="filter.endDateTo" (change)="loadPolicies()">
            </div>
          </div>
          <div class="filter-footer">
             <button class="btn btn-secondary btn-sm" (click)="clearAllFilters()" *ngIf="hasAnyFilter()">
               Clear Filters
             </button>
             <button class="btn btn-primary btn-sm" (click)="showAdvancedFilters = false">
               Close
             </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <app-spinner *ngIf="loading" 
                   [overlay]="true" 
                   message="Synchronizing policies with encrypted cloud storage...">
      </app-spinner>


      <!-- Table -->
      <div class="glass-card" *ngIf="!loading" style="padding:0;overflow:hidden">
        <div class="scroll-container">
          <table class="data-table" *ngIf="pagedResult && pagedResult.items.length > 0" style="table-layout: fixed; width: max-content; min-width: 100%;">
            <thead>
              <tr id="policyHeadersList" 
                  cdkDropList 
                  cdkDropListOrientation="horizontal"
                  [cdkDropListConnectedTo]="['policyGroupingList']">
                <th *ngFor="let col of visibleColumns" 
                    [style.width.px]="columnWidths[col.field]"
                    style="position: sticky;"
                    [style.cursor]="col.sortable ? 'pointer' : 'default'">
                  <div class="header-content"
                       (click)="col.sortable ? sortBy(col.field) : null"
                       cdkDrag 
                       [cdkDragData]="col.field"
                       style="display:flex; align-items:center; justify-content:space-between; gap:4px; padding-right: 8px;">
                    <span>
                      {{ col.label }}
                      <span class="sort-icon" *ngIf="col.sortable">{{ getSortIcon(col.field) }}</span>
                    </span>
                    <span class="material-icons-round drag-handle" style="font-size:14px; opacity:0.3">drag_indicator</span>
                    
                    <!-- Drag Preview -->
                    <div *cdkDragPreview class="cdk-drag-preview" style="padding:8px; background:white; border-radius:4px; box-shadow:0 4px 6px -1px rgba(0,0,0,0.1)">
                      {{ col.label }}
                    </div>
                  </div>
                  <!-- Resize Handle -->
                  <div class="resize-handle" (mousedown)="onResizeColumn($event, col.field)"></div>
                </th>
                <th style="position: sticky; width: 160px;">Actions</th>
              </tr>
            </thead>
            <tbody class="policy-list-body">
              <!-- Ungrouped View -->
              <ng-container *ngIf="!groupByField">
                <tr *ngFor="let policy of pagedResult.items; trackBy: trackByPolicyId" 
                    class="policy-row" [class.overdue-row]="isOverdue(policy)">
                  <td *ngFor="let col of visibleColumns" [attr.data-label]="col.label" [style.width.px]="columnWidths[col.field]">
                    <ng-container [ngSwitch]="true">
                      <a *ngSwitchCase="col.field === 'policyNumber'" [routerLink]="['/policies', policy.id]" class="text-primary fw-600">
                        {{ policy.policyNumber }}
                      </a>
                      <span *ngSwitchCase="col.isCurrency" class="fw-600">
                        {{ ($any(policy)[col.field] || 0) | inrCurrency }}
                      </span>
                      <span *ngSwitchCase="col.isDate" class="text-muted">
                        {{ $any(policy)[col.field] | date:'dd MMM yyyy' }}
                      </span>
                      <span *ngSwitchCase="col.field === 'status'" class="badge" [class]="'badge-' + policy.status.toLowerCase()">
                        {{ policy.status }}
                      </span>
                      <div *ngSwitchCase="col.field === 'nextInstallmentDate'">
                        <div [class.overdue-text]="isOverdue(policy)" [class.due-soon-text]="isDueSoon(policy)">
                          {{ policy.nextInstallmentDate ? (policy.nextInstallmentDate | date:'dd MMM yyyy') : '-' }}
                        </div>
                        <div class="text-muted" style="font-size:0.65rem" *ngIf="policy.nextInstallmentDate">
                          {{ getDaysLabel(policy) }}
                        </div>
                      </div>
                      <span *ngSwitchCase="col.field === 'policyTypeName'" class="type-badge">
                        {{ policy.policyTypeName }}
                      </span>
                      <span *ngSwitchDefault>
                        {{ ($any(policy)[col.field] || '-') | truncateText:30 }}
                      </span>
                    </ng-container>
                  </td>
                  <td>
                    <div class="action-btns">
                      <button class="btn btn-secondary btn-sm btn-icon" (click)="markAsPaid(policy)" title="Mark as Paid">
                        <span class="material-icons-round" style="font-size:15px">payments</span>
                      </button>
                      <a [routerLink]="['/policies', policy.id]" class="btn btn-secondary btn-sm btn-icon" title="View">
                        <span class="material-icons-round" style="font-size:15px">visibility</span>
                      </a>
                      <a [routerLink]="['/policies', policy.id, 'edit']" class="btn btn-secondary btn-sm btn-icon" title="Edit">
                        <span class="material-icons-round" style="font-size:15px">edit</span>
                      </a>
                      <button class="btn btn-secondary btn-sm btn-icon" (click)="copyPolicy(policy)" title="Copy Policy">
                        <span class="material-icons-round" style="font-size:15px">content_copy</span>
                      </button>
                      <button class="btn btn-secondary btn-sm btn-icon hover-danger" (click)="deletePolicy(policy)" title="Delete">
                        <span class="material-icons-round" style="font-size:15px; color: var(--color-danger)">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              </ng-container>

              <!-- Grouped View -->
              <ng-container *ngIf="groupByField">
                <ng-container *ngFor="let item of displayItems; trackBy: trackByItem">
                  <tr class="group-header" (click)="toggleGroup(item.groupValue)" style="cursor:pointer; user-select:none">
                    <td [attr.colspan]="visibleColumns.length + 1" style="background: rgba(99,102,241,0.08); border-left: 4px solid var(--color-primary-light);">
                      <div class="d-flex align-center justify-between" style="width:100%">
                        <div class="d-flex align-center gap-sm">
                          <span class="material-icons-round" style="font-size:18px;color:var(--color-primary-light); transition: transform 0.2s" 
                                [style.transform]="isExpanded(item.groupValue) ? 'rotate(0deg)' : 'rotate(-90deg)'">
                            expand_more
                          </span>
                          <strong style="font-size:0.95rem">{{ item.groupValue }}</strong>
                          <span class="badge badge-secondary" style="font-size:0.7rem">{{ item.policies.length }} Policies</span>
                          <span class="badge badge-primary" style="font-size:0.75rem; background:rgba(16,185,129,0.1); color:#10b981; border:1px solid rgba(16,185,129,0.2)">
                            Total: {{ item.summary | inrCurrency }}
                          </span>
                        </div>
                        <div class="text-muted" style="font-size:0.7rem">
                          {{ isExpanded(item.groupValue) ? 'Click to collapse' : 'Click to expand' }}
                        </div>
                      </div>
                    </td>
                  </tr>
                  <ng-container *ngIf="isExpanded(item.groupValue)">
                    <tr *ngFor="let policy of item.policies; trackBy: trackByPolicyId" class="policy-row grouped-row">
                      <td *ngFor="let col of visibleColumns" [attr.data-label]="col.label" [style.width.px]="columnWidths[col.field]">
                        <ng-container [ngSwitch]="true">
                          <a *ngSwitchCase="col.field === 'policyNumber'" [routerLink]="['/policies', policy.id]" class="text-primary fw-600">
                            {{ policy.policyNumber }}
                          </a>
                          <span *ngSwitchCase="col.isCurrency" class="fw-600">
                            {{ ($any(policy)[col.field] || 0) | inrCurrency }}
                          </span>
                          <span *ngSwitchCase="col.isDate" class="text-muted">
                            {{ $any(policy)[col.field] | date:'dd MMM yyyy' }}
                          </span>
                          <span *ngSwitchCase="col.field === 'status'" class="badge" [class]="'badge-' + policy.status.toLowerCase()">
                            {{ policy.status }}
                          </span>
                          <div *ngSwitchCase="col.field === 'nextInstallmentDate'">
                            <div [class.overdue-text]="isOverdue(policy)" [class.due-soon-text]="isDueSoon(policy)">
                              {{ policy.nextInstallmentDate ? (policy.nextInstallmentDate | date:'dd MMM yyyy') : '-' }}
                            </div>
                          </div>
                          <span *ngSwitchCase="col.field === 'policyTypeName'" class="type-badge">
                            {{ policy.policyTypeName }}
                          </span>
                          <span *ngSwitchDefault>
                            {{ ($any(policy)[col.field] || '-') | truncateText:30 }}
                          </span>
                        </ng-container>
                      </td>
                      <td>
                        <div class="action-btns">
                          <button class="btn btn-secondary btn-sm btn-icon" (click)="markAsPaid(policy)" title="Mark as Paid">
                            <span class="material-icons-round" style="font-size:15px">payments</span>
                          </button>
                          <a [routerLink]="['/policies', policy.id]" class="btn btn-secondary btn-sm btn-icon" title="View">
                            <span class="material-icons-round" style="font-size:15px">visibility</span>
                          </a>
                          <a [routerLink]="['/policies', policy.id, 'edit']" class="btn btn-secondary btn-sm btn-icon" title="Edit">
                            <span class="material-icons-round" style="font-size:15px">edit</span>
                          </a>
                          <button class="btn btn-secondary btn-sm btn-icon" (click)="copyPolicy(policy)" title="Copy Policy">
                            <span class="material-icons-round" style="font-size:15px">content_copy</span>
                          </button>
                          <button class="btn btn-secondary btn-sm btn-icon hover-danger" (click)="deletePolicy(policy)" title="Delete">
                            <span class="material-icons-round" style="font-size:15px; color: var(--color-danger)">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  </ng-container>
                </ng-container>
              </ng-container>
            </tbody>
            <tfoot>
              <tr class="table-total-row">
                <td *ngFor="let col of visibleColumns; let first = first" [style.width.px]="columnWidths[col.field]">
                  <ng-container [ngSwitch]="col.field">
                    <span *ngSwitchCase="'premiumAmount'" class="fw-800">
                      {{ getPremiumTotal() | inrCurrency }}
                    </span>
                    <span *ngSwitchCase="'yearlyPremiumAmount'" class="fw-800">
                      {{ getYearlyPremiumTotal() | inrCurrency }}
                    </span>
                    <span *ngSwitchCase="'totalPaidAmount'" class="fw-800">
                      {{ getTotalPaidTotal() | inrCurrency }}
                    </span>
                    <span *ngSwitchDefault>
                      <strong>{{ first ? 'Total' : '' }}</strong>
                    </span>
                  </ng-container>
                </td>
                <td style="width: 160px;"></td>
              </tr>
            </tfoot>
          </table>

          <!-- Empty state -->
          <app-empty-state *ngIf="pagedResult && pagedResult.items.length === 0"
                           icon="search_off"
                           title="No Policies Found"
                           description="Try adjusting your search or filters to find what you’re looking for."
                           actionLabel="Create New Policy"
                           actionIcon="add"
                           (actionClicked)="router.navigate(['/policies/new'])">
          </app-empty-state>
        </div>

        <!-- Pagination -->
        <div class="pagination-wrapper" *ngIf="pagedResult">
          <div class="pagination-info text-muted d-flex align-center gap-md">
            <div class="d-flex align-center gap-sm">
              <label style="font-size:0.75rem">Show</label>
              <select class="page-size-select" [(ngModel)]="filter.pageSize" (change)="loadPolicies()">
                <option [ngValue]="10">10</option>
                <option [ngValue]="20">20</option>
                <option [ngValue]="50">50</option>
                <option [ngValue]="100">100</option>
                <option [ngValue]="200">200</option>
                <option [ngValue]="500">500</option>
              </select>
              <label style="font-size:0.75rem">entries</label>
            </div>
            <span>
              Showing {{ (pagedResult.pageNumber - 1) * pagedResult.pageSize + 1 }}
              - {{ Math.min(pagedResult.pageNumber * pagedResult.pageSize, pagedResult.totalCount) }}
              of {{ pagedResult.totalCount }}
            </span>
          </div>
          <div class="pagination" *ngIf="pagedResult.totalPages > 1">
            <button class="pagination-btn" (click)="goToPage(1)"
                    [disabled]="!pagedResult.hasPreviousPage">
              <span class="material-icons-round" style="font-size:16px">first_page</span>
            </button>
            <button class="pagination-btn" (click)="goToPage(pagedResult.pageNumber - 1)"
                    [disabled]="!pagedResult.hasPreviousPage">
              <span class="material-icons-round" style="font-size:16px">chevron_left</span>
            </button>
            <button *ngFor="let p of getPageNumbers()" class="pagination-btn"
                    [class.active]="p === pagedResult.pageNumber"
                    (click)="goToPage(p)">
              {{ p }}
            </button>
            <button class="pagination-btn" (click)="goToPage(pagedResult.pageNumber + 1)"
                    [disabled]="!pagedResult.hasNextPage">
              <span class="material-icons-round" style="font-size:16px">chevron_right</span>
            </button>
            <button class="pagination-btn" (click)="goToPage(pagedResult.totalPages)"
                    [disabled]="!pagedResult.hasNextPage">
              <span class="material-icons-round" style="font-size:16px">last_page</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Delete confirmation modal -->
      <div class="modal-overlay" *ngIf="showDeleteModal" (click)="showDeleteModal = false">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h4>
              <span class="material-icons-round" style="color:var(--color-danger);vertical-align:middle;margin-right:8px">warning</span>
              Confirm Delete / Inactivate
            </h4>
          </div>
          <div class="modal-body">
            <p>Are you sure you want to delete policy <strong>{{ policyToDelete?.policyNumber }}</strong>?</p>
            <p class="text-muted mt-sm" style="font-size:0.85rem">This will mark the policy status as <strong>Inactive</strong> and exclude it from active reminder calendars.</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showDeleteModal = false">Cancel</button>
            <button class="btn btn-danger" (click)="confirmDelete()">Inactivate Policy</button>
          </div>
        </div>
      </div>

      <!-- Test Email Modal -->
      <div class="modal-overlay" *ngIf="showTestEmailModal" (click)="showTestEmailModal = false">
        <div class="modal-content" (click)="$event.stopPropagation()" style="max-width:480px">
          <div class="modal-header">
            <h4>
              <span class="material-icons-round" style="color:var(--color-primary-light);vertical-align:middle;margin-right:8px">mail</span>
              Send Test Reminder Email
            </h4>
          </div>
          <div class="modal-body">
            <p style="margin-bottom:12px">Send a test reminder email for <strong>{{ testEmailPolicy?.policyNumber }}</strong></p>
            <div class="form-group">
              <label class="form-label">Recipient Email</label>
              <input type="email" class="form-control" [(ngModel)]="testEmailRecipient" 
                     placeholder="Leave blank to use policy holder email">
              <div class="text-muted" style="font-size:0.75rem;margin-top:4px">
                Policy holder email: {{ testEmailPolicy?.email }}
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showTestEmailModal = false">Cancel</button>
            <button class="btn btn-primary" (click)="confirmSendTestEmail()" [disabled]="sendingTestEmail">
              <span class="material-icons-round" *ngIf="!sendingTestEmail" style="font-size:16px">send</span>
              <span class="spinner sm" *ngIf="sendingTestEmail"></span>
              {{ sendingTestEmail ? 'Sending...' : 'Send Test Email' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Sync / Payment Confirmation Modal -->
    <div class="modal-overlay" *ngIf="showConfirmModal" (click)="showConfirmModal = false">
      <div class="modal-content confirm-modal-content" (click)="$event.stopPropagation()" style="max-width: 800px; width: 95%;">
        <div class="modal-header">
          <h4>
            <span class="material-icons-round" style="color: var(--color-primary-light); vertical-align: middle; margin-right: 8px">
              {{ confirmModalType === 'sync' ? 'sync' : 'payments' }}
            </span>
            {{ confirmModalTitle }}
          </h4>
        </div>
        <div class="modal-body" style="max-height: 60vh; overflow-y: auto; padding-right: 8px;">
          <p class="text-muted" style="margin-bottom: 16px; font-size: 0.9rem; line-height: 1.5;">
            {{ confirmModalDescription }}
          </p>

          <div class="confirm-policy-list">
            <div class="confirm-policy-item" *ngFor="let item of confirmItems">
              <div class="confirm-policy-info">
                <span class="confirm-policy-name">{{ item.policyHolderName }}</span>
                <span class="confirm-policy-meta">
                  <span class="confirm-title-pill">{{ item.policyNumber }}</span>
                  <span style="font-weight: 500;">{{ item.companyName }}</span>
                </span>
              </div>
              <div class="confirm-policy-info">
                <span style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; letter-spacing: 0.5px;">Term Coverage</span>
                <span style="font-size:0.8rem; color:#cbd5e1; font-weight:600;">
                  {{ item.startDate | date:'dd MMM yyyy' }} - {{ item.endDate | date:'dd MMM yyyy' }}
                </span>
              </div>
              <div class="confirm-policy-dates-flow">
                <div class="d-flex align-center gap-sm">
                  <div class="d-flex flex-column align-end">
                    <span style="font-size:0.65rem; color:var(--text-muted); text-transform:uppercase; margin-bottom:2px; font-weight:600; letter-spacing:0.5px;">Current Due</span>
                    <span class="date-badge old">
                      {{ item.currentNextInstallmentDate ? (item.currentNextInstallmentDate | date:'dd MMM yyyy') : '—' }}
                    </span>
                  </div>
                  <span class="material-icons-round text-muted" style="margin-top: 14px; opacity:0.5; font-size:18px">arrow_forward</span>
                  <div class="d-flex flex-column align-start">
                    <span style="font-size:0.65rem; color:var(--color-primary-light); text-transform:uppercase; margin-bottom:2px; font-weight:600; letter-spacing:0.5px;">New Next Due</span>
                    <span class="date-badge new">
                      {{ item.newNextInstallmentDate ? (item.newNextInstallmentDate | date:'dd MMM yyyy') : 'None (One Time)' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="empty-state py-lg" *ngIf="confirmItems.length === 0">
              <span class="material-icons-round text-muted mb-sm" style="font-size:32px">verified</span>
              <p>No policies require date updates at this time.</p>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="showConfirmModal = false">Cancel</button>
          <button class="btn btn-primary" (click)="executeConfirmedAction()" [disabled]="confirmItems.length === 0 || executingConfirmAction">
            <span class="spinner sm" *ngIf="executingConfirmAction"></span>
            {{ executingConfirmAction ? 'Updating...' : 'Confirm & Update' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrl: './policy-list.component.css'
})
export class PolicyListComponent implements OnInit {
  pagedResult: PagedResult<Policy> | null = null;
  policyTypes: PolicyType[] = [];
  loading = true;
  uploadingExcel = false;
  showDeleteModal = false;
  policyToDelete: Policy | null = null;
  searchTimeout: any;
  isOffline = false;
  isGroupedByHolder = false;
  loadingExport = false;
  showAdvancedFilters = false;
  showTestEmailModal = false;
  testEmailPolicy: Policy | null = null;
  testEmailRecipient = '';
  sendingTestEmail = false;
  
  // Confirmation Modal Properties
  showConfirmModal = false;
  confirmModalType: 'sync' | 'pay' = 'sync';
  confirmModalTitle = '';
  confirmModalDescription = '';
  confirmItems: any[] = [];
  executingConfirmAction = false;
  selectedPayPolicy: any = null;
  selectedPayDto: any = null;
  expandedGroups: Set<string> = new Set<string>();
  familyMembers: FamilyMember[] = [];
  stats = {
    totalPremium: 0,
    totalCount: 0,
    activeCount: 0,
    expiringSoon: 0,
    upcomingPremium: 0
  };

  Math = Math; // expose to template

  filter: PolicyFilter = {
    searchTerm: '',
    statuses: [],
    policyTypeIds: [],
    installmentTypes: [],
    familyMemberIds: [],
    sortBy: localStorage.getItem('policyListSortBy') || 'createdAt',
    sortDirection: (localStorage.getItem('policyListSortDirection') as 'asc' | 'desc') || 'desc',
    pageNumber: 1,
    pageSize: 100
  };

  // Multi-select state
  openDropdown: string | null = null;
  dropdownSearch = { policyType: '', family: '' };

  allStatuses = ['Active', 'Inactive', 'Expired', 'Cancelled', 'Completed', 'Pending'];
  allInstallmentTypes = ['Monthly', 'Quarterly', 'Half-Yearly', 'Yearly', 'One Time'];

  get filteredPolicyTypes() {
    const s = this.dropdownSearch.policyType.toLowerCase();
    return s ? this.policyTypes.filter(t => t.name.toLowerCase().includes(s)) : this.policyTypes;
  }

  get filteredFamilyMembers() {
    const s = this.dropdownSearch.family.toLowerCase();
    return s ? this.familyMembers.filter(m => m.name.toLowerCase().includes(s)) : this.familyMembers;
  }

  toggleDropdown(name: string): void {
    this.openDropdown = this.openDropdown === name ? null : name;
  }

  closeDropdown(name: string): void {
    if (this.openDropdown === name) this.openDropdown = null;
  }

  isSelected(arr: any[] | undefined, val: any): boolean {
    return !!(arr && arr.includes(val));
  }

  toggleArrayItem(obj: any, key: string, val: any): void {
    if (!obj[key]) obj[key] = [];
    const idx = obj[key].indexOf(val);
    if (idx === -1) obj[key] = [...obj[key], val];
    else obj[key] = obj[key].filter((v: any) => v !== val);
  }

  getSelectionLabel(ids: number[] | undefined, items: any[], idKey: string, labelKey: string, placeholder: string): string {
    if (!ids || ids.length === 0) return placeholder;
    if (ids.length === 1) {
      const found = items.find(i => i[idKey] === ids[0]);
      return found ? found[labelKey] : placeholder;
    }
    return `${ids.length} selected`;
  }

  getSelectionLabelFromList(vals: string[] | undefined, all: string[], placeholder: string): string {
    if (!vals || vals.length === 0) return placeholder;
    if (vals.length === 1) return vals[0];
    return `${vals.length} selected`;
  }

  displayItems: any[] = [];
  groupByField: string | null = localStorage.getItem('policyListGroupBy') || null;
  showColumnSelector = false;

  columns = [
    { label: 'Policy #', field: 'policyNumber', visible: true, sortable: true },
    { label: 'Holder', field: 'policyHolderName', visible: true, sortable: true },
    { label: 'Plan ID / Scheme', field: 'schemeName', visible: true },
    { label: 'Company', field: 'companyName', visible: true },
    { label: 'Type', field: 'policyTypeName', visible: true },
    { label: 'Premium', field: 'premiumAmount', visible: true, sortable: true, isCurrency: true },
    { label: 'Yearly Premium', field: 'yearlyPremiumAmount', visible: true, sortable: true, isCurrency: true },
    { label: 'Coverage', field: 'coverageAmount', visible: true, isCurrency: true },
    { label: 'Start Date', field: 'startDate', visible: true, sortable: true, isDate: true },
    { label: 'End Date', field: 'endDate', visible: true, sortable: true, isDate: true },
    { label: 'Status', field: 'status', visible: true, sortable: true },
    { label: 'Next Inst.', field: 'nextInstallmentDate', visible: true, sortable: true, isDate: true },
    { label: 'Inst. Type', field: 'installmentType', visible: true },
    { label: 'Maturity', field: 'maturityDate', visible: true, sortable: true, isDate: true },
    { label: 'Email', field: 'email', visible: true, sortable: true },
    // Advanced grid columns toggleable from filter selection list
    { label: 'Total Paid', field: 'totalPaidAmount', visible: false, isCurrency: true },
    { label: 'Phone Number', field: 'phoneNumber', visible: false },
    { label: 'Product Name', field: 'productName', visible: false },
    { label: 'Location/Unit', field: 'locationUnit', visible: false },
    { label: 'Duration', field: 'duration', visible: false },
    { label: 'Coverage Desc', field: 'coverageDescription', visible: false },
    { label: 'Tax Amount', field: 'taxAmount', visible: false, isCurrency: true },
    { label: 'GST', field: 'gstApplicable', visible: false },
    { label: 'Inst. Amount', field: 'installmentAmount', visible: false, isCurrency: true },
    { label: 'Net Premium', field: 'netPremium', visible: false, isCurrency: true },
    { label: 'Bank Account', field: 'bankAccountDetails', visible: false },
    { label: 'Agent Name', field: 'agentName', visible: false },
    { label: 'Alt. Contact', field: 'alternateContactNumber', visible: false },
    { label: 'Special Remarks', field: 'specialRemarks', visible: false },
    { label: 'Total Maturity', field: 'totalMaturityAmount', visible: false, isCurrency: true },
    { label: 'Additional Details', field: 'additionalDetails', visible: false },
    { label: 'Nominee', field: 'nomineeName', visible: false },
    { label: 'Nominee Relation', field: 'nomineeRelation', visible: false },
    { label: 'Annuity Date', field: 'annuityDate', visible: false, isDate: true },
    { label: 'Annuity Amount', field: 'annuityAmount', visible: false, isCurrency: true },
    { label: 'Auto Debit', field: 'autoDebit', visible: false },
    { label: 'Term Years', field: 'termYears', visible: false },
    { label: 'Paying Term', field: 'payingTerm', visible: false },
    { label: 'Age at Inception', field: 'ageAtInception', visible: false },
    { label: 'Family Member', field: 'familyMemberName', visible: false }
  ];

  columnWidths: { [key: string]: number } = {
    policyNumber: 130,
    policyHolderName: 150,
    schemeName: 130,
    companyName: 130,
    policyTypeName: 110,
    premiumAmount: 110,
    yearlyPremiumAmount: 130,
    coverageAmount: 110,
    startDate: 110,
    endDate: 110,
    status: 90,
    nextInstallmentDate: 125,
    installmentType: 110,
    maturityDate: 110,
    email: 180,
    totalPaidAmount: 120,
    phoneNumber: 120,
    productName: 120,
    locationUnit: 120,
    duration: 100,
    coverageDescription: 180,
    taxAmount: 110,
    gstApplicable: 90,
    installmentAmount: 120,
    netPremium: 120,
    bankAccountDetails: 150,
    agentName: 120,
    alternateContactNumber: 130,
    specialRemarks: 180,
    totalMaturityAmount: 130,
    additionalDetails: 180,
    nomineeName: 120,
    nomineeRelation: 120,
    annuityDate: 110,
    annuityAmount: 120,
    autoDebit: 100,
    termYears: 100,
    payingTerm: 110,
    ageAtInception: 100,
    familyMemberName: 130
  };

  onResizeColumn(event: MouseEvent, field: string): void {
    event.preventDefault();
    event.stopPropagation();

    const startX = event.clientX;
    const thElement = (event.target as HTMLElement).parentElement;
    if (!thElement) return;
    const startWidth = thElement.offsetWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(60, startWidth + (moveEvent.clientX - startX));
      this.columnWidths[field] = newWidth;
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  get visibleColumns() {
    return this.columns.filter(c => c.visible);
  }

  private destroyRef = inject(DestroyRef);

  constructor(
    private policyService: PolicyService,
    private policyTypeService: PolicyTypeService,
    private familyMemberService: FamilyMemberService,
    private route: ActivatedRoute,
    public router: Router,
    public authService: AuthService,
    private offlineStorage: OfflineStorageService,
    private toast: ToastService
  ) { }


  ngOnInit(): void {
    this.loadColumnsVisibility();
    this.familyMemberService.getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(res => {
        this.familyMembers = res.data;
      });

    this.policyTypeService.getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(res => {
        this.policyTypes = res.data;
      });

    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        // Reset filter to defaults but keep pagination
        const pageNum = this.filter.pageNumber;
        const pageSize = this.filter.pageSize;

        if (params['status'] || params['searchTerm'] || params['familyMemberId']) {
          this.filter = {
            pageNumber: 1,
            pageSize: pageSize,
            sortBy: localStorage.getItem('policyListSortBy') || 'createdAt',
            sortDirection: (localStorage.getItem('policyListSortDirection') as 'asc' | 'desc') || 'desc'
          };
        }

        if (params['status']) this.filter.statuses = [params['status']];
        if (params['searchTerm']) this.filter.searchTerm = params['searchTerm'];
        if (params['familyMemberId']) {
          this.filter.familyMemberIds = [Number(params['familyMemberId'])];
          this.showAdvancedFilters = true;
        }
        if (params['installmentFilter'] === 'upcoming') {
          this.filter.installmentTypes = [];
          this.showAdvancedFilters = true;
        }
        this.loadPolicies();
      });
  }

  async loadPolicies() {
    this.loading = true;
    this.filter.pageNumber = this.filter.pageNumber || 1;

    this.policyService.getPolicies(this.filter)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: async (res) => {
          if (res.data && res.data.items) {
            const { fyStart, fyEnd } = this.getCurrentFYRange();
            res.data.items = res.data.items.map((p: any) => ({
              ...p,
              yearlyPremiumAmount: this.calculateYearlyPremiumForFY(p, fyStart, fyEnd),
              totalPaidAmount: this.calculateTotalPaidTillDate(p)
            }));

            // Client-side sorting for yearlyPremiumAmount
            if (this.filter.sortBy === 'yearlyPremiumAmount') {
              const dir = this.filter.sortDirection === 'desc' ? -1 : 1;
              res.data.items.sort((a: any, b: any) => {
                const valA = a.yearlyPremiumAmount || 0;
                const valB = b.yearlyPremiumAmount || 0;
                return (valA - valB) * dir;
              });
            }
          }
          this.pagedResult = res.data;
          this.isOffline = false;
          this.updateDisplayItems();
          this.calculateStats();

          // Cache for offline use
          if (this.pagedResult && this.pagedResult.items) {
            await this.offlineStorage.savePolicies(this.pagedResult.items);
          }

          this.loading = false;
        },
        error: async () => {
          this.isOffline = true;
          const cached = await this.offlineStorage.getPolicies();
          if (cached.length > 0) {
            const { fyStart, fyEnd } = this.getCurrentFYRange();
            let items = cached.map((p: any) => ({
              ...p,
              yearlyPremiumAmount: this.calculateYearlyPremiumForFY(p, fyStart, fyEnd),
              totalPaidAmount: this.calculateTotalPaidTillDate(p)
            }));

            // Client-side sorting for yearlyPremiumAmount
            if (this.filter.sortBy === 'yearlyPremiumAmount') {
              const dir = this.filter.sortDirection === 'desc' ? -1 : 1;
              items.sort((a: any, b: any) => {
                const valA = a.yearlyPremiumAmount || 0;
                const valB = b.yearlyPremiumAmount || 0;
                return (valA - valB) * dir;
              });
            }

            this.pagedResult = {
              items,
              totalCount: cached.length,
              pageNumber: 1,
              pageSize: cached.length,
              totalPages: 1,
              hasPreviousPage: false,
              hasNextPage: false
            };
            this.updateDisplayItems();
            this.calculateStats();
            this.toast.info('Viewing offline data');
          } else {
            this.toast.error('Network error and no offline data found');
          }
          this.loading = false;
        }
      });
  }


  private getAnnualMultiplier(type: string | undefined): number {
    if (!type) return 1;
    switch (type.toLowerCase()) {
      case 'monthly': return 12;
      case 'quarterly': return 4;
      case 'half-yearly': return 2;
      case 'yearly': return 1;
      case 'one time':
      case 'single':
        return 1;
      default: return 1;
    }
  }

  getCurrentFYRange(): { fyStart: Date, fyEnd: Date } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentYear = today.getFullYear();
    const fyStartYear = today.getMonth() >= 3 ? currentYear : currentYear - 1; // Indian FY starts in April (Month index 3)
    const fyStart = new Date(Date.UTC(fyStartYear, 3, 1, 0, 0, 0, 0));
    const fyEnd = new Date(Date.UTC(fyStartYear + 1, 2, 31, 23, 59, 59, 999));
    return { fyStart, fyEnd };
  }

  calculateYearlyPremiumForFY(p: any, fyStart: Date, fyEnd: Date): number {
    if (p.status !== 'Active') {
      return 0;
    }

    const premium = p.premiumAmount || 0;
    if (premium <= 0) return 0;

    const instType = (p.installmentType || '').toLowerCase();
    const start = p.startDate ? new Date(p.startDate) : null;
    const end = p.endDate ? new Date(p.endDate) : null;
    const nextInst = p.nextInstallmentDate ? new Date(p.nextInstallmentDate) : null;

    // Safeguard against default/uninitialized dates (e.g. 0001-01-01 or Year < 1900)
    if (start && start.getFullYear() < 1900) return 0;
    if (end && end.getFullYear() < 1900) return 0;
    if (nextInst && nextInst.getFullYear() < 1900) return 0;

    // 1. If it's a One-Time or Single payment policy
    if (instType === 'one time' || instType === 'single' || !p.installmentType) {
      if (start && start >= fyStart && start <= fyEnd) {
        return premium;
      }
      return 0;
    }

    // 2. For recurring payments, if nextInstallmentDate is not available, we can fallback to calculating from startDate
    let firstInstallmentDate: Date;
    if (p.nextInstallmentDate) {
      firstInstallmentDate = new Date(p.nextInstallmentDate);
    } else if (start) {
      firstInstallmentDate = new Date(start);
    } else {
      return 0;
    }

    // We want to project all installment dates from firstInstallmentDate
    // either forwards or backwards, to find which ones fall in the FY [fyStart, fyEnd]
    let total = 0;
    let currentDue = new Date(firstInstallmentDate);
    
    // Safety check: align currentDue to start of policy if start is earlier
    if (start && start < currentDue) {
      currentDue = new Date(start);
    }

    // Loop forward and add up all installments in the FY
    let iterations = 0;
    while (currentDue <= fyEnd && (!end || currentDue <= end) && iterations < 1000) {
      iterations++;
      if (currentDue >= fyStart) {
        total += premium;
      }

      if (instType === 'monthly') {
        currentDue.setMonth(currentDue.getMonth() + 1);
      } else if (instType === 'quarterly') {
        currentDue.setMonth(currentDue.getMonth() + 3);
      } else if (instType === 'half-yearly') {
        currentDue.setMonth(currentDue.getMonth() + 6);
      } else if (instType === 'yearly') {
        currentDue.setFullYear(currentDue.getFullYear() + 1);
      } else {
        break;
      }
    }

    return total;
  }

  exportToExcel(): void {
    if (!this.pagedResult || this.pagedResult.totalCount === 0) {
      this.toast.error('No policy data available to export');
      return;
    }

    this.loadingExport = true;
    this.toast.info('Generating Excel export...');
    
    // Create a copy of the current filters, but with a massive page size to retrieve ALL matching items
    const exportFilter = {
      ...this.filter,
      pageNumber: 1,
      pageSize: 100000
    };

    this.policyService.getPolicies(exportFilter)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.loadingExport = false;
          const allItems = res.data?.items || [];
          if (allItems.length === 0) {
            this.toast.error('No policy data to export');
            return;
          }

          try {
            const { fyStart, fyEnd } = this.getCurrentFYRange();
            // Map to rows with only visible columns
            const rows = allItems.map(policy => {
              const rowData: any = {};
              this.visibleColumns.forEach(col => {
                let val = (policy as any)[col.field];
                
                // Explicitly calculate yearlyPremiumAmount and totalPaidAmount
                if (col.field === 'yearlyPremiumAmount') {
                  val = this.calculateYearlyPremiumForFY(policy, fyStart, fyEnd);
                } else if (col.field === 'totalPaidAmount') {
                  val = this.calculateTotalPaidTillDate(policy);
                }

                if (col.isDate && val) {
                  val = new Date(val).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  });
                } else if (col.isCurrency && val !== undefined && val !== null) {
                  val = Number(val);
                } else if (col.field === 'gstApplicable') {
                  val = val === 'Y' ? 'Yes' : 'No';
                } else if (col.field === 'autoDebit') {
                  val = val === 'Y' ? 'Yes' : 'No';
                }
                
                rowData[col.label] = val !== null && val !== undefined ? val : '-';
              });
              return rowData;
            });

            const worksheet = XLSX.utils.json_to_sheet(rows);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Policies');

            const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            this.saveAsExcelFile(excelBuffer, 'Policies_Export');
            this.toast.success('Excel export completed successfully');
          } catch (error) {
            console.error('Export generation error:', error);
            this.toast.error('Failed to generate Excel file');
          }
        },
        error: () => {
          this.loadingExport = false;
          this.toast.error('Failed to fetch policy data for export');
        }
      });
  }

  private saveAsExcelFile(buffer: any, fileName: string): void {
    const data: Blob = new Blob([buffer], { type: 'application/octet-stream' });
    const url = window.URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}_${new Date().toISOString().substring(0, 10)}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  getPremiumTotal(): number {
    if (!this.pagedResult || !this.pagedResult.items) return 0;
    return this.pagedResult.items.reduce((sum, p) => sum + (p.premiumAmount || 0), 0);
  }

  getYearlyPremiumTotal(): number {
    if (!this.pagedResult || !this.pagedResult.items) return 0;
    return this.pagedResult.items.reduce((sum, p) => sum + (p.yearlyPremiumAmount || 0), 0);
  }

  getTotalPaidTotal(): number {
    if (!this.pagedResult || !this.pagedResult.items) return 0;
    return this.pagedResult.items.reduce((sum, p) => sum + (p.totalPaidAmount || 0), 0);
  }

  calculateTotalPaidTillDate(p: any): number {
    if (p.status !== 'Active') {
      return p.totalPaidAmount || 0;
    }

    const premium = p.premiumAmount || 0;
    const installment = p.installmentAmount || premium || 0;
    if (installment <= 0) return 0;

    const instType = (p.installmentType || '').toLowerCase();
    const start = p.startDate ? new Date(p.startDate) : null;
    const nextInst = p.nextInstallmentDate ? new Date(p.nextInstallmentDate) : null;

    if (!start) return 0;

    // Safeguard against default/uninitialized dates (e.g. 0001-01-01 or Year < 1900)
    if (start.getFullYear() < 1900) return p.totalPaidAmount || 0;
    if (nextInst && (nextInst.getFullYear() < 1900 || nextInst.getTime() < start.getTime())) return p.totalPaidAmount || 0;

    // Reset times to avoid timezone/time-of-day offsets
    start.setHours(0, 0, 0, 0);
    if (nextInst) {
      nextInst.setHours(0, 0, 0, 0);
    }

    // 1. One-time or single payment
    if (instType === 'one time' || instType === 'single' || !p.installmentType) {
      return premium; 
    }

    // 2. If nextInstallmentDate is not set, or is invalid, return saved or 0
    if (!nextInst) {
      return p.totalPaidAmount || 0;
    }

    // We count how many installment dates fall between [startDate, nextInstallmentDate)
    let total = 0;
    let currentDue = new Date(start);
    
    // Safety precaution to avoid infinite loop
    let iterations = 0;
    while (currentDue < nextInst && iterations < 1000) {
      iterations++;
      total += installment;

      if (instType === 'monthly') {
        currentDue.setMonth(currentDue.getMonth() + 1);
      } else if (instType === 'quarterly') {
        currentDue.setMonth(currentDue.getMonth() + 3);
      } else if (instType === 'half-yearly') {
        currentDue.setMonth(currentDue.getMonth() + 6);
      } else if (instType === 'yearly') {
        currentDue.setFullYear(currentDue.getFullYear() + 1);
      } else {
        break;
      }
    }

    return total;
  }

  private calculateStats(): void {
    if (!this.pagedResult) return;

    const policies = this.pagedResult.items;
    this.stats.totalCount = policies.length;
    
    const { fyStart, fyEnd } = this.getCurrentFYRange();
    this.stats.totalPremium = policies
      .filter(p => p.status === 'Active')
      .reduce((acc, p) => acc + this.calculateYearlyPremiumForFY(p, fyStart, fyEnd), 0);
      
    this.stats.activeCount = policies.filter(p => p.status === 'Active').length;

    const soon = new Date();
    soon.setDate(soon.getDate() + 30);
    this.stats.expiringSoon = policies.filter(p => {
      if (!p.endDate) return false;
      const end = new Date(p.endDate);
      return p.status === 'Active' && end <= soon && end >= new Date();
    }).length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.stats.upcomingPremium = policies
      .filter(p => p.status === 'Active' && p.nextInstallmentDate)
      .reduce((acc, p) => acc + this.calculateBudgetForRange(p, today, fyEnd), 0);
  }

  private calculateBudgetForRange(p: any, rangeStart: Date, rangeEnd: Date): number {
    if (p.nextInstallmentDate && new Date(p.nextInstallmentDate).getFullYear() < 1900) {
      return 0;
    }
    if (p.endDate && new Date(p.endDate).getFullYear() < 1900) {
      return 0;
    }

    if (!p.nextInstallmentDate || !p.installmentType) {
      if (p.nextInstallmentDate) {
        const d = new Date(p.nextInstallmentDate);
        if (d >= rangeStart && d <= rangeEnd) {
          return p.installmentAmount || p.premiumAmount || 0;
        }
      }
      return 0;
    }

    let total = 0;
    let currentDue = new Date(p.nextInstallmentDate);
    const type = p.installmentType.toLowerCase();
    const endDate = p.endDate ? new Date(p.endDate) : null;

    let iterations = 0;
    while (currentDue <= rangeEnd && (!endDate || currentDue <= endDate) && iterations < 1000) {
      iterations++;
      if (currentDue >= rangeStart) {
        total += p.installmentAmount || p.premiumAmount || 0;
      }

      if (type === 'monthly') {
        currentDue.setMonth(currentDue.getMonth() + 1);
      } else if (type === 'quarterly') {
        currentDue.setMonth(currentDue.getMonth() + 3);
      } else if (type === 'half-yearly') {
        currentDue.setMonth(currentDue.getMonth() + 6);
      } else if (type === 'yearly') {
        currentDue.setFullYear(currentDue.getFullYear() + 1);
      } else {
        break; // One-time / single
      }

      if (type === 'one time' || type === 'single') break;
    }

    return total;
  }

  loadColumnsVisibility(): void {
    const saved = localStorage.getItem('policyListVisibleColumns');
    if (saved) {
      try {
        const visibleFields: string[] = JSON.parse(saved);
        this.columns.forEach(col => {
          col.visible = visibleFields.includes(col.field);
        });
      } catch (e) {
        console.error('Error parsing visible columns from localStorage', e);
      }
    }
  }

  saveColumnsVisibility(): void {
    const visibleFields = this.columns.filter(col => col.visible).map(col => col.field);
    localStorage.setItem('policyListVisibleColumns', JSON.stringify(visibleFields));
  }

  onColumnVisibilityChange(): void {
    this.saveColumnsVisibility();
    this.updateDisplayItems();
  }

  updateDisplayItems(): void {
    if (!this.pagedResult) {
      this.displayItems = [];
      return;
    }

    if (this.groupByField) {
      const groups = new Map<string, Policy[]>();
      this.pagedResult.items.forEach(p => {
        const val = (p as any)[this.groupByField!] || 'N/A';
        if (!groups.has(val)) groups.set(val, []);
        groups.get(val)!.push(p);
      });
      this.displayItems = Array.from(groups.entries()).map(([name, policies]) => ({
        groupValue: name,
        policies,
        isGroup: true,
        summary: policies.reduce((sum, p) => sum + (p.premiumAmount || 0), 0)
      }));

      // Auto-expand all groups
      this.displayItems.forEach(item => this.expandedGroups.add(item.groupValue));
    } else {
      this.displayItems = this.pagedResult.items;
    }
  }

  onColumnDropped(event: CdkDragDrop<string[]>): void {
    const field = event.item.data;
    this.groupBy(field);
  }

  groupBy(field: string | null): void {
    this.groupByField = field;
    if (field) {
      localStorage.setItem('policyListGroupBy', field);
    } else {
      localStorage.removeItem('policyListGroupBy');
    }
    this.updateDisplayItems();
  }

  getColumnLabel(field: string): string {
    const col = this.columns.find(c => c.field === field);
    return col ? col.label : field;
  }

  clearGrouping(): void {
    this.groupBy(null);
  }

  toggleGroup(groupValue: string): void {
    if (this.expandedGroups.has(groupValue)) {
      this.expandedGroups.delete(groupValue);
    } else {
      this.expandedGroups.add(groupValue);
    }
  }

  isExpanded(groupValue: string): boolean {
    return this.expandedGroups.has(groupValue);
  }

  toggleColumnSelector(): void {
    this.showColumnSelector = !this.showColumnSelector;
  }

  clearAllFilters(): void {
    this.filter = {
      searchTerm: '',
      statuses: [],
      companyName: '',
      policyTypeIds: [],
      familyMemberIds: [],
      installmentTypes: [],
      startDateFrom: undefined,
      endDateTo: undefined,
      sortBy: localStorage.getItem('policyListSortBy') || 'createdAt',
      sortDirection: (localStorage.getItem('policyListSortDirection') as 'asc' | 'desc') || 'desc',
      pageNumber: 1,
      pageSize: 100
    };
    this.openDropdown = null;
    this.loadPolicies();
  }

  hasAnyFilter(): boolean {
    return !!(
      this.filter.searchTerm ||
      (this.filter.statuses && this.filter.statuses.length > 0) ||
      this.filter.companyName ||
      (this.filter.policyTypeIds && this.filter.policyTypeIds.length > 0) ||
      (this.filter.familyMemberIds && this.filter.familyMemberIds.length > 0) ||
      this.filter.startDateFrom ||
      this.filter.endDateTo ||
      (this.filter.installmentTypes && this.filter.installmentTypes.length > 0)
    );
  }

  onSearch(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.filter.pageNumber = 1;
      this.loadPolicies();
    }, 400);
  }

  sortBy(field: string): void {
    if (this.filter.sortBy === field) {
      this.filter.sortDirection = this.filter.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.filter.sortBy = field;
      this.filter.sortDirection = 'asc';
    }
    localStorage.setItem('policyListSortBy', this.filter.sortBy || '');
    localStorage.setItem('policyListSortDirection', this.filter.sortDirection || '');
    this.loadPolicies();
  }

  getSortIcon(field: string): string {
    if (this.filter.sortBy !== field) return '↕';
    return this.filter.sortDirection === 'asc' ? '↑' : '↓';
  }

  goToPage(page: number): void {
    this.filter.pageNumber = page;
    this.loadPolicies();
  }

  getPageNumbers(): number[] {
    if (!this.pagedResult) return [];
    const total = this.pagedResult.totalPages;
    const current = this.pagedResult.pageNumber;
    const pages: number[] = [];
    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  get activeAdvancedFilterCount(): number {
    let count = 0;
    if (this.filter.policyTypeIds?.length) count++;
    if (this.filter.statuses?.length) count++;
    if (this.filter.installmentTypes?.length) count++;
    if (this.filter.familyMemberIds?.length) count++;
    if (this.filter.companyName) count++;
    if (this.filter.startDateFrom) count++;
    if (this.filter.endDateTo) count++;
    return count;
  }

  // ── Date helpers for installment display ─────────
  isOverdue(policy: Policy): boolean {
    if (!policy.nextInstallmentDate || policy.status !== 'Active') return false;
    return new Date(policy.nextInstallmentDate) < new Date();
  }

  isDueSoon(policy: Policy): boolean {
    if (!policy.nextInstallmentDate || policy.status !== 'Active') return false;
    const dueDate = new Date(policy.nextInstallmentDate);
    const today = new Date();
    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  }

  getDaysLabel(policy: Policy): string {
    if (!policy.nextInstallmentDate) return '';
    const dueDate = new Date(policy.nextInstallmentDate);
    const today = new Date();
    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `${diffDays}d away`;
  }

  // ── Test Email ────────────────────────────────────
  sendTestEmail(policy: Policy): void {
    this.testEmailPolicy = policy;
    this.testEmailRecipient = '';
    this.showTestEmailModal = true;
  }

  confirmSendTestEmail(): void {
    if (!this.testEmailPolicy) return;
    this.sendingTestEmail = true;
    this.policyService.sendTestEmail({
      policyId: this.testEmailPolicy.id,
      recipientEmail: this.testEmailRecipient || undefined
    }).subscribe({
      next: (res) => {
        this.sendingTestEmail = false;
        if (res.success) {
          this.toast.success(res.message || 'Test email queued successfully!');
          this.showTestEmailModal = false;
        } else {
          this.toast.error(res.message || 'Failed to send test email');
        }
      },
      error: (err) => {
        this.sendingTestEmail = false;
        this.toast.error(err.error?.message || 'Error sending test email');
      }
    });
  }

  // ── Existing methods ────────────────────────────────

  viewDocument(doc: any): void {
    const url = this.policyService.getDownloadUrl(doc.id);
    window.open(url, '_blank');
  }

  copyPolicy(policy: Policy): void {
    this.router.navigate(['/policies/new'], { queryParams: { copyFrom: policy.id } });
  }

  deletePolicy(policy: Policy): void {
    this.policyToDelete = policy;
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    if (!this.policyToDelete) return;
    this.policyService.deletePolicy(this.policyToDelete.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.toast.success('Policy deleted successfully');
          this.showDeleteModal = false;
          this.policyToDelete = null;
          this.loadPolicies();
        } else {
          this.toast.error(res.message || 'Failed to delete policy');
        }
      },
      error: (err) => {
        const errorMsg = err.error?.message || 'Error occurred while deleting';
        this.toast.error(errorMsg);
      }
    });
  }

  onExcelSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    this.uploadingExcel = true;
    this.policyService.uploadExcel(file).subscribe({
      next: (res) => {
        this.uploadingExcel = false;
        if (res.success) {
          const result = res.data as any;
          // Use the detailed summary message from backend
          this.toast.success(res.message);

          if (result.errors && result.errors.length > 0) {
            this.toast.info(`Note: ${result.failedCount} rows had issues.`);
            result.errors.slice(0, 3).forEach((err: string) => this.toast.error(err));
          }

          if (result.importedPolicyNumbers?.length > 0) {
            console.log('Successfully Imported Policies:', result.importedPolicyNumbers);
          }

          this.loadPolicies();
        } else {
          this.toast.error(res.message || 'Upload failed');
        }
      },
      error: (err) => {
        this.uploadingExcel = false;
        this.toast.error('Error uploading file');
        console.error(err);
      }
    });

    event.target.value = ''; // reset file input
  }

  calculateNextInstallmentPreview(currentDate: string | Date | null, type: string): Date | null {
    if (!currentDate || !type) return null;
    const d = new Date(currentDate);
    const t = type.toLowerCase();
    if (t === 'one time' || t === 'single') return null;
    if (t === 'monthly') return new Date(d.setMonth(d.getMonth() + 1));
    if (t === 'quarterly') return new Date(d.setMonth(d.getMonth() + 3));
    if (t === 'half-yearly') return new Date(d.setMonth(d.getMonth() + 6));
    if (t === 'yearly') return new Date(d.setFullYear(d.getFullYear() + 1));
    return new Date(d.setMonth(d.getMonth() + 1));
  }

  syncInstallments(): void {
    this.loading = true;
    this.policyService.getSyncPreview().subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.confirmItems = res.data || [];
          if (this.confirmItems.length === 0) {
            this.toast.info('All policy installment dates are already synchronized and up-to-date!');
            return;
          }
          this.confirmModalType = 'sync';
          this.confirmModalTitle = 'Sync Due Dates Confirmation';
          this.confirmModalDescription = 'The following active policies have overdue installment dates. Confirming this sync will advance their due dates to the next upcoming occurrence based on their premium frequency.';
          this.showConfirmModal = true;
        } else {
          this.toast.error(res.message || 'Failed to fetch sync preview');
        }
      },
      error: (err) => {
        this.loading = false;
        this.toast.error('Error fetching sync preview');
        console.error(err);
      }
    });
  }

  markAsPaid(policy: Policy): void {
    this.selectedPayPolicy = policy;
    this.selectedPayDto = {
      policyId: policy.id,
      amount: policy.premiumAmount,
      paymentDate: new Date().toISOString(),
      paymentMethod: 'Online',
      notes: 'Quick pay from list'
    };

    const currentDue = policy.nextInstallmentDate ? new Date(policy.nextInstallmentDate) : new Date();
    const nextDue = this.calculateNextInstallmentPreview(currentDue, policy.installmentType || '');

    this.confirmItems = [{
      policyId: policy.id,
      policyNumber: policy.policyNumber,
      policyHolderName: policy.policyHolderName,
      companyName: policy.companyName || 'N/A',
      startDate: policy.startDate,
      endDate: policy.endDate,
      currentNextInstallmentDate: policy.nextInstallmentDate,
      newNextInstallmentDate: nextDue,
      installmentType: policy.installmentType
    }];

    this.confirmModalType = 'pay';
    this.confirmModalTitle = 'Confirm Premium Payment';
    this.confirmModalDescription = 'Are you sure you want to mark this installment as Paid? This will record the payment and update the next installment date as shown below.';
    this.showConfirmModal = true;
  }

  executeConfirmedAction(): void {
    if (this.confirmItems.length === 0) return;
    this.executingConfirmAction = true;

    if (this.confirmModalType === 'sync') {
      this.policyService.syncInstallments().subscribe({
        next: (res) => {
          this.executingConfirmAction = false;
          this.showConfirmModal = false;
          if (res.success) {
            this.toast.success(`Successfully synchronized ${res.data} policies.`);
            this.loadPolicies();
          } else {
            this.toast.error(res.message || 'Sync failed');
          }
        },
        error: (err) => {
          this.executingConfirmAction = false;
          this.showConfirmModal = false;
          this.toast.error('Error synchronizing installments');
          console.error(err);
        }
      });
    } else if (this.confirmModalType === 'pay') {
      if (!this.selectedPayPolicy || !this.selectedPayDto) {
        this.executingConfirmAction = false;
        this.showConfirmModal = false;
        return;
      }
      this.policyService.markAsPaid(this.selectedPayPolicy.id, this.selectedPayDto).subscribe({
        next: (res) => {
          this.executingConfirmAction = false;
          this.showConfirmModal = false;
          if (res.success) {
            this.toast.success(`Payment recorded for ${this.selectedPayPolicy.policyNumber}`);
            this.loadPolicies();
          } else {
            this.toast.error(res.message || 'Failed to update payment');
          }
        },
        error: (err) => {
          this.executingConfirmAction = false;
          this.showConfirmModal = false;
          this.toast.error(err.error?.message || 'Error marking payment');
        }
      });
    }
  }

  trackByPolicyId(index: number, policy: Policy): number {
    return policy.id;
  }

  exportToCsv(): void {
    this.loadingExport = true;
    this.policyService.exportToCsv(this.filter).subscribe({
      next: (blob) => {
        this.loadingExport = false;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Policies_Export_${new Date().getTime()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.toast.success('Policies exported successfully');
      },
      error: (err) => {
        this.loadingExport = false;
        this.toast.error('Error exporting policies');
      }
    });
  }

  downloadTemplate(): void {
    this.policyService.downloadTemplate().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Policy_Import_Template_2026.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.toast.success('Template downloaded successfully');
      },
      error: (err) => {
        this.toast.error('Error downloading template');
      }
    });
  }

  trackByItem(index: number, item: any): any {
    return this.isGroupedByHolder ? item.holderName : item.id;
  }
}
