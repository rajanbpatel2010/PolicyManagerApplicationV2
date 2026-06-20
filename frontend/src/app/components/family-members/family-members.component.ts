import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FamilyMemberService } from '../../services/family-member.service';
import { FamilyMember, CreateFamilyMember, FamilyMemberPolicySummary } from '../../models/models';
import { ToastService } from '../../services/toast.service';
import { InrCurrencyPipe } from '../../pipes/pipes';

import { FamilyTreeComponent } from './family-tree/family-tree.component';

@Component({
  selector: 'app-family-members',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FamilyTreeComponent, InrCurrencyPipe],
  templateUrl: './family-members.component.html',
  styleUrl: './family-members.component.css'
})
export class FamilyMembersComponent implements OnInit {
  members: FamilyMember[] = [];
  loading = false;
  showAddModal = false;
  editingMemberId: number | null = null;
  viewMode: 'list' | 'tree' = 'list';

  // Side panel state
  showPolicyPanel = false;
  selectedMember: FamilyMember | null = null;
  panelSearch = '';
  panelStatusFilter = '';
  filteredPanelPolicies: FamilyMemberPolicySummary[] = [];
  
  newMember: CreateFamilyMember = {
    name: '',
    dateOfBirth: '',
    relationship: 'Self',
    parentId: undefined
  };

  constructor(
    private familyMemberService: FamilyMemberService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadMembers();
  }

  loadMembers(): void {
    this.loading = true;
    this.familyMemberService.getAll().subscribe({
      next: (res) => {
        this.members = res.data;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  // ── Policy Side Panel ────────────────────────────────────
  openPolicyPanel(member: FamilyMember): void {
    this.selectedMember = member;
    this.panelSearch = '';
    this.panelStatusFilter = '';
    this.filteredPanelPolicies = member.policies ?? [];
    this.showPolicyPanel = true;
  }

  closePolicyPanel(): void {
    this.showPolicyPanel = false;
    this.selectedMember = null;
  }

  filterPanelPolicies(): void {
    if (!this.selectedMember?.policies) {
      this.filteredPanelPolicies = [];
      return;
    }
    let policies = this.selectedMember.policies;
    
    if (this.panelSearch.trim()) {
      const term = this.panelSearch.toLowerCase();
      policies = policies.filter(p =>
        p.policyNumber.toLowerCase().includes(term) ||
        p.policyTypeName.toLowerCase().includes(term) ||
        (p.companyName ?? '').toLowerCase().includes(term)
      );
    }
    if (this.panelStatusFilter) {
      policies = policies.filter(p => p.status === this.panelStatusFilter);
    }
    this.filteredPanelPolicies = policies;
  }

  // ── Add / Edit Modal ─────────────────────────────────────
  openAddModal(): void {
    this.editingMemberId = null;
    this.newMember = { name: '', dateOfBirth: '', relationship: 'Self', parentId: undefined };
    this.showAddModal = true;
  }

  openEditModal(member: FamilyMember): void {
    this.editingMemberId = member.id;
    
    // Extract YYYY-MM-DD directly to avoid timezone shift issues with native Date object
    const localDateString = member.dateOfBirth ? member.dateOfBirth.split('T')[0] : '';

    this.newMember = {
      name: member.name,
      dateOfBirth: localDateString,
      relationship: member.relationship,
      parentId: member.parentId
    };
    this.showAddModal = true;
  }

  saveMember(): void {
    if (!this.newMember.name || !this.newMember.dateOfBirth) {
      this.toast.error('Please fill in both Name and Date of Birth');
      return;
    }
    
    this.loading = true;
    if (this.editingMemberId) {
      this.familyMemberService.update(this.editingMemberId, this.newMember).subscribe({
        next: (res) => {
          this.loading = false;
          if (res.success) {
            this.toast.success('Family member updated');
            this.loadMembers();
            this.showAddModal = false;
          } else {
            this.toast.error(res.message || 'Failed to update member');
          }
        },
        error: (err) => {
          this.loading = false;
          this.toast.error(err.error?.message || 'Server error occurred while updating');
        }
      });
    } else {
      this.familyMemberService.create(this.newMember).subscribe({
        next: (res) => {
          this.loading = false;
          if (res.success) {
            this.toast.success('Family member added');
            this.loadMembers();
            this.showAddModal = false;
          } else {
            this.toast.error(res.message || 'Failed to add member');
          }
        },
        error: (err) => {
          this.loading = false;
          this.toast.error(err.error?.message || 'Server error occurred while adding');
          console.error('Save error:', err);
        }
      });
    }
  }

  deleteMember(id: number): void {
    if (confirm('Are you sure? This will affect policies linked to this member.')) {
      this.familyMemberService.delete(id).subscribe(() => {
        this.toast.success('Member removed');
        this.loadMembers();
      });
    }
  }
}
