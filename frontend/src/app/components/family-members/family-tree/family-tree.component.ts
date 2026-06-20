import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FamilyMember } from '../../../models/models';
import { InrCurrencyPipe } from '../../../pipes/pipes';

interface TreeNode extends FamilyMember {
  treeChildren: TreeNode[];
}

@Component({
  selector: 'app-family-tree',
  standalone: true,
  imports: [CommonModule, InrCurrencyPipe],
  template: `
    <div class="tree-container">
      <div class="tree-wrapper">
        <div class="tree">
          <ul>
            <ng-container *ngTemplateOutlet="nodeTemplate; context: { $implicit: rootNodes }"></ng-container>
          </ul>
        </div>
      </div>
      <div class="tree-hint mobile-only">
        <span class="material-icons-round">swipe</span>
        Scroll to explore tree
      </div>
    </div>

    <ng-template #nodeTemplate let-nodes>
      <li *ngFor="let node of nodes">
        <div class="member-card m3-surface" (click)="onMemberClick(node)" [class.selected]="selectedId === node.id">
          <div class="member-info">
            <span class="member-relation">{{ node.relationship }}</span>
            <h4 class="member-name">{{ node.name }}</h4>
            <span class="member-dob">{{ node.dateOfBirth | date:'yyyy' }}</span>
          </div>
          
          <!-- Modern Policy Indicators -->
          <div class="policy-pills" *ngIf="(node.policyCount ?? 0) > 0">
            <span class="pill primary">
              <span class="material-icons-round">description</span>
              {{ node.policyCount }}
            </span>
            <span class="pill success" *ngIf="(node.totalPremium ?? 0) > 0">
              {{ node.totalPremium | inrCurrency }}
            </span>
          </div>
          
          <div class="no-policies" *ngIf="(node.policyCount ?? 0) === 0">
            <span class="material-icons-round">sentiment_neutral</span>
          </div>
        </div>
        <ul *ngIf="node.treeChildren && node.treeChildren.length > 0">
          <ng-container *ngTemplateOutlet="nodeTemplate; context: { $implicit: node.treeChildren }"></ng-container>
        </ul>
      </li>
    </ng-template>

  `,
  styles: [`
    .tree-container {
      position: relative;
      width: 100%;
      background: var(--bg-main);
      border-radius: var(--radius-lg);
      overflow: hidden;
    }

    .tree-wrapper {
      width: 100%;
      overflow-x: auto;
      overflow-y: auto;
      padding: 40px;
      display: flex;
      justify-content: center;
      -webkit-overflow-scrolling: touch; /* Momentum scrolling */
    }

    .tree-hint {
      position: absolute;
      bottom: 16px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0,0,0,0.6);
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 0.7rem;
      color: white;
      display: flex;
      align-items: center;
      gap: 6px;
      pointer-events: none;
      z-index: 10;
    }

    .tree ul {
      padding-top: 40px;
      position: relative;
      display: flex;
      justify-content: center;
    }

    .tree li {
      float: left;
      text-align: center;
      list-style-type: none;
      position: relative;
      padding: 40px 10px 0 10px;
    }

    /* Modern M3 Connections */
    .tree li::before, .tree li::after {
      content: '';
      position: absolute;
      top: 0;
      right: 50%;
      border-top: 2px solid var(--border-color);
      width: 50%;
      height: 40px;
    }
    .tree li::after {
      right: auto;
      left: 50%;
      border-left: 2px solid var(--border-color);
    }

    .tree li:only-child::after, .tree li:only-child::before { display: none; }
    .tree li:only-child { padding-top: 0; }
    .tree li:first-child::before, .tree li:last-child::after { border: 0 none; }
    .tree li:last-child::before {
      border-right: 2px solid var(--border-color);
      border-radius: 0 12px 0 0;
    }
    .tree li:first-child::after { border-radius: 12px 0 0 0; }

    .tree ul ul::before {
      content: '';
      position: absolute;
      top: 0;
      left: 50%;
      border-left: 2px solid var(--border-color);
      width: 0;
      height: 40px;
    }

    /* M3 Member Card */
    .member-card {
      padding: 1.25rem;
      display: inline-flex;
      flex-direction: column;
      min-width: 200px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      color: var(--text-primary);
      position: relative;
      transition: all var(--transition-base);
      cursor: pointer;
      box-shadow: var(--shadow-sm);
    }

    .member-card:hover {
      background: var(--bg-card-hover);
      border-color: var(--color-primary-light);
      transform: translateY(-4px);
      box-shadow: var(--shadow-md);
    }

    .member-card.selected {
      border-color: var(--color-primary-light);
      background: rgba(103, 80, 164, 0.08);
      box-shadow: 0 0 0 2px var(--color-primary-light);
    }

    .member-relation {
      font-size: 0.65rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      font-weight: 700;
    }

    .member-name {
      margin: 8px 0;
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text-white);
    }

    .member-dob {
      font-size: 0.8rem;
      color: var(--color-primary-light);
      font-weight: 600;
    }

    .policy-pills {
      display: flex;
      gap: 8px;
      margin-top: 12px;
      justify-content: center;
    }

    .pill {
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 0.7rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .pill.primary { background: rgba(103, 80, 164, 0.1); color: var(--color-primary-light); }
    .pill.success { background: rgba(20, 193, 92, 0.1); color: var(--color-success); }

    .no-policies {
      margin-top: 12px;
      color: var(--text-muted);
      opacity: 0.5;
    }

    @media (max-width: 768px) {
      .member-card { min-width: 160px; padding: 1rem; }
      .member-name { font-size: 1rem; }
      .mobile-only { display: flex; }
    }

  `]
})
export class FamilyTreeComponent implements OnChanges {
  @Input() members: FamilyMember[] = [];
  @Output() memberSelected = new EventEmitter<FamilyMember>();
  rootNodes: TreeNode[] = [];
  selectedId: number | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['members']) {
      this.buildTree();
    }
  }

  onMemberClick(node: TreeNode): void {
    this.selectedId = node.id;
    this.memberSelected.emit(node);
  }

  getUniqueTypes(policies: any[]): string[] {
    if (!policies) return [];
    return [...new Set(policies.map(p => p.policyTypeName).filter(Boolean))];
  }

  private buildTree(): void {
    const map = new Map<number, TreeNode>();
    
    // First pass: Create nodes
    this.members.forEach(m => {
      map.set(m.id, { ...m, treeChildren: [] });
    });

    this.rootNodes = [];

    // Second pass: Link children to parents
    this.members.forEach(m => {
      const node = map.get(m.id)!;
      if (m.parentId && map.has(m.parentId)) {
        map.get(m.parentId)!.treeChildren.push(node);
      } else {
        this.rootNodes.push(node);
      }
    });
  }
}
