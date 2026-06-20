import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FamilyMemberService } from '../../../services/family-member.service';
import { FamilyMember } from '../../../models/models';

@Component({
  selector: 'app-member-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './member-selector.component.html',
  styleUrl: './member-selector.component.css'
})
export class MemberSelectorComponent implements OnInit {
  members: FamilyMember[] = [];
  selectedMemberNames: string[] = [];
  isAllSelected = true;

  @Output() selectionChange = new EventEmitter<string[]>();

  constructor(private familyMemberService: FamilyMemberService) {}

  ngOnInit(): void {
    this.familyMemberService.getAll().subscribe(res => {
      if (res.success) {
        this.members = res.data;
      }
    });
  }

  toggleMember(name: string): void {
    this.isAllSelected = false;
    const index = this.selectedMemberNames.indexOf(name);
    if (index > -1) {
      this.selectedMemberNames.splice(index, 1);
    } else {
      this.selectedMemberNames.push(name);
    }
    
    if (this.selectedMemberNames.length === 0) {
      this.selectAll();
    } else {
      this.selectionChange.emit(this.selectedMemberNames);
    }
  }

  selectAll(): void {
    this.isAllSelected = true;
    this.selectedMemberNames = [];
    this.selectionChange.emit([]); // Empty array means "All" in my logic
  }

  isSelected(name: string): boolean {
    return this.isAllSelected || this.selectedMemberNames.includes(name);
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }
}
