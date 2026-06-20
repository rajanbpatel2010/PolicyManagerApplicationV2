import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { OfflineStorageService } from '../../services/offline-storage.service';
import { PolicyService, PolicyTypeService } from '../../services/policy.service';
import { Policy, PolicyType, PolicyFilter, PagedResult, FamilyMember } from '../../models/models';
import { FamilyMemberService } from '../../services/family-member.service';
import { InrCurrencyPipe, TimeAgoPipe, TruncateTextPipe } from '../../pipes/pipes';

@Component({
  selector: 'app-one-time-investment',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, InrCurrencyPipe, TimeAgoPipe, TruncateTextPipe, DragDropModule],
  templateUrl: './one-time-investment.component.html',
  styleUrls: ['./one-time-investment.component.css']
})
export class OneTimeInvestmentComponent implements OnInit {
  private policyService = inject(PolicyService);
  private policyTypeService = inject(PolicyTypeService);
  private familyMemberService = inject(FamilyMemberService);
  private toast = inject(ToastService);
  public authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private offlineStorage = inject(OfflineStorageService);

  pagedResult: PagedResult<Policy> | null = null;
  policyTypes: PolicyType[] = [];
  familyMembers: FamilyMember[] = [];
  loading = false;
  loadingExport = false;
  isOffline = false;
  showAdvancedFilters = false;
  showColumnSelector = false;

  filter: PolicyFilter = {
    pageNumber: 1,
    pageSize: 10,
    sortBy: 'CreatedAt',
    sortDirection: 'desc',
    installmentTypes: ['One Time'],
    statuses: ['Active']
  };

  stats = {
    totalValue: 0,
    count: 0,
    maturedCount: 0
  };

  columns = [
    { label: 'Policy Holder', field: 'policyHolderName', visible: true, sortable: true },
    { label: 'Policy No.', field: 'policyNumber', visible: true, sortable: true },
    { label: 'Type', field: 'policyTypeName', visible: true, sortable: true },
    { label: 'Premium/Investment', field: 'premiumAmount', visible: true, sortable: true },
    { label: 'Company', field: 'companyName', visible: true, sortable: true },
    { label: 'Product', field: 'productName', visible: false, sortable: true },
    { label: 'Start Date', field: 'startDate', visible: true, sortable: true },
    { label: 'Maturity Date', field: 'maturityDate', visible: true, sortable: true },
    { label: 'Status', field: 'status', visible: true, sortable: true }
  ];

  groupByField: string | null = null;
  displayItems: any[] = [];

  get visibleColumns() {
    return this.columns.filter(c => c.visible);
  }

  ngOnInit(): void {
    this.loadData();
    this.loadPolicyTypes();
    this.loadFamilyMembers();
  }

  loadData() {
    this.loading = true;
    this.policyService.getPolicies(this.filter)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: async (res) => {
          this.pagedResult = res.data;
          this.isOffline = false;
          this.updateDisplayItems();
          this.calculateStats();
          
          if (this.pagedResult && this.pagedResult.items) {
            await this.offlineStorage.savePolicies(this.pagedResult.items);
          }
          this.loading = false;
        },
        error: async () => {
          this.isOffline = true;
          const cached = await this.offlineStorage.getPolicies();
          const oneTimeCached = cached.filter(p => p.installmentType === 'One Time');
          if (oneTimeCached.length > 0) {
            this.pagedResult = {
              items: oneTimeCached,
              totalCount: oneTimeCached.length,
              pageNumber: 1,
              pageSize: oneTimeCached.length,
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

  loadPolicyTypes() {
    this.policyTypeService.getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(res => this.policyTypes = res.data);
  }

  loadFamilyMembers() {
    this.familyMemberService.getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(res => this.familyMembers = res.data);
  }

  calculateStats() {
    if (!this.pagedResult) return;
    const items = this.pagedResult.items;
    this.stats.totalValue = items.reduce((acc, p) => acc + (p.premiumAmount || 0), 0);
    this.stats.count = items.length;
    this.stats.maturedCount = items.filter(p => p.status === 'Expired').length;
  }

  updateDisplayItems() {
    if (!this.pagedResult) {
      this.displayItems = [];
      return;
    }
    this.displayItems = this.pagedResult.items;
  }

  onSearch() {
    this.filter.pageNumber = 1;
    this.loadData();
  }

  sortBy(field: string) {
    if (this.filter.sortBy === field) {
      this.filter.sortDirection = this.filter.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.filter.sortBy = field;
      this.filter.sortDirection = 'asc';
    }
    this.loadData();
  }

  getSortIcon(field: string): string {
    if (this.filter.sortBy !== field) return '↕️';
    return this.filter.sortDirection === 'asc' ? '↑' : '↓';
  }

  changePage(page: number) {
    if (page < 1 || (this.pagedResult && page > this.pagedResult.totalPages)) return;
    this.filter.pageNumber = page;
    this.loadData();
  }

  get activeAdvancedFilterCount(): number {
    let count = 0;
    if (this.filter.policyTypeIds?.length) count++;
    if (this.filter.statuses?.length && !(this.filter.statuses.length === 1 && this.filter.statuses[0] === 'Active')) count++;
    if (this.filter.familyMemberIds?.length) count++;
    if (this.filter.companyName) count++;
    if (this.filter.startDateFrom) count++;
    if (this.filter.endDateTo) count++;
    return count;
  }

  hasAnyFilter(): boolean {
    return this.activeAdvancedFilterCount > 0 || !!this.filter.searchTerm;
  }

  clearAllFilters() {
    this.filter = {
      ...this.filter,
      searchTerm: '',
      policyTypeIds: [],
      statuses: ['Active'],
      familyMemberIds: [],
      companyName: '',
      startDateFrom: undefined,
      endDateTo: undefined,
      pageNumber: 1
    };
    this.loadData();
  }

  toggleColumnSelector() {
    this.showColumnSelector = !this.showColumnSelector;
  }

  exportToCsv() {
    this.loadingExport = true;
    this.policyService.exportToCsv(this.filter).subscribe({
      next: (blob) => {
        this.loadingExport = false;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `OneTime_Investments_${new Date().getTime()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.toast.success('Investments exported successfully');
      },
      error: (err) => {
        this.loadingExport = false;
        this.toast.error('Error exporting investments');
      }
    });
  }

  trackByPolicyId(index: number, policy: Policy): number {
    return policy.id;
  }
}
