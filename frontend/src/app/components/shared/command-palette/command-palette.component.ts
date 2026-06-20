import { Component, OnInit, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AiService } from '../../../services/ai.service';
import { PolicyService } from '../../../services/policy.service';
import { Policy } from '../../../models/models';
import { SpinnerComponent } from '../spinner/spinner.component';

@Component({
  selector: 'app-command-palette',
  standalone: true,
  imports: [CommonModule, FormsModule, SpinnerComponent],
  template: `
    <div class="command-overlay" *ngIf="isOpen" (click)="close()">
      <div class="command-modal" (click)="$event.stopPropagation()">
        <div class="command-search-wrap">
          <span class="material-icons-round search-icon">terminal</span>
          <input #searchInput
                 type="text" 
                 [(ngModel)]="query" 
                 (ngModelChange)="onQueryChange()"
                 (keydown.enter)="handleEnter()"
                 placeholder="Type a command or ask AI (e.g. 'How many LIC policies I have?')..." 
                 class="command-input">
          <span class="command-esc">ESC</span>
        </div>

        <div class="command-results custom-scrollbar" *ngIf="query">
          <!-- AI Response Section -->
          <div class="result-group" *ngIf="aiResponse || aiLoading">
            <div class="group-label">AI Insight</div>
            <div class="ai-answer-card" *ngIf="aiResponse">
              <span class="material-icons-round ai-sparkle">auto_awesome</span>
              <p>{{ aiResponse }}</p>
            </div>
            <div class="ai-loading" *ngIf="aiLoading">
              <app-spinner [inline]="true" message="AI is thinking..."></app-spinner>
            </div>
          </div>

          <!-- Navigation Section -->
          <div class="result-group" *ngIf="filteredCommands.length > 0">
            <div class="group-label">Commands</div>
            <div *ngFor="let cmd of filteredCommands; let i = index" 
                 class="result-item" 
                 [class.active]="selectedIndex === i"
                 (click)="executeCommand(cmd)">
              <span class="material-icons-round">{{ cmd.icon }}</span>
              <div class="result-info">
                <div class="result-title">{{ cmd.label }}</div>
                <div class="result-desc">{{ cmd.desc }}</div>
              </div>
            </div>
          </div>

          <!-- Policies Section -->
          <div class="result-group" *ngIf="filteredPolicies.length > 0">
            <div class="group-label">Policies</div>
            <div *ngFor="let p of filteredPolicies" 
                 class="result-item" 
                 (click)="navigateToPolicy(p.id)">
              <span class="material-icons-round">description</span>
              <div class="result-info">
                <div class="result-title">{{ p.policyNumber }} - {{ p.policyHolderName }}</div>
                <div class="result-desc">{{ p.policyTypeName }} | {{ p.premiumAmount | currency:'INR' }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="command-footer" *ngIf="!query">
          <div class="footer-hint">
            <span class="key">↑↓</span> to navigate
            <span class="key">↵</span> to select
            <span class="key">?</span> for help
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .command-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(8px);
      z-index: 9999;
      display: flex;
      justify-content: center;
      padding-top: 15vh;
    }

    .command-modal {
      width: 100%;
      max-width: 650px;
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 20px;
      box-shadow: var(--shadow-xl);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      max-height: 60vh;
    }

    .command-search-wrap {
      display: flex;
      align-items: center;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border-subtle);
      gap: 1rem;
    }

    .search-icon { color: var(--action-primary); }

    .command-input {
      flex: 1;
      background: transparent;
      border: none;
      color: var(--text-main);
      font-size: 1.1rem;
      outline: none;
      font-family: 'DM Sans', sans-serif;
    }

    .command-esc {
      font-size: 0.7rem;
      font-weight: 800;
      color: var(--text-muted);
      padding: 4px 8px;
      border: 1px solid var(--border-subtle);
      border-radius: 6px;
    }

    .command-results {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
    }

    .result-group {
      margin-bottom: 1.5rem;
    }

    .group-label {
      font-size: 0.7rem;
      font-weight: 800;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 0.5rem;
      padding-left: 0.5rem;
    }

    .result-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
      color: var(--text-muted);
    }

    .result-item:hover, .result-item.active {
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-main);
    }

    .result-info {
      display: flex;
      flex-direction: column;
    }

    .result-title {
      font-size: 0.95rem;
      font-weight: 600;
    }

    .result-desc {
      font-size: 0.75rem;
      opacity: 0.7;
    }

    .ai-answer-card {
      background: rgba(103, 114, 241, 0.1);
      border: 1px solid rgba(103, 114, 241, 0.2);
      border-radius: 12px;
      padding: 1rem;
      position: relative;
      margin: 0.5rem;
    }

    .ai-sparkle {
      position: absolute;
      top: -10px;
      right: -10px;
      color: var(--action-primary);
      background: var(--bg-card);
      border-radius: 50%;
      padding: 4px;
    }

    .ai-answer-card p {
      margin: 0;
      font-size: 0.9rem;
      line-height: 1.6;
      color: var(--text-main);
    }

    .command-footer {
      padding: 0.75rem 1.5rem;
      background: rgba(0, 0, 0, 0.2);
      border-top: 1px solid var(--border-subtle);
    }

    .footer-hint {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .key {
      background: rgba(255, 255, 255, 0.1);
      padding: 2px 6px;
      border-radius: 4px;
      color: var(--text-main);
      margin: 0 4px;
    }
  `]
})
export class CommandPaletteComponent implements OnInit {
  isOpen = false;
  query = '';
  selectedIndex = 0;
  
  aiLoading = false;
  aiResponse: string | null = null;
  
  commands = [
    { label: 'Go to Dashboard', desc: 'View your portfolio summary', icon: 'dashboard', route: '/dashboard' },
    { label: 'View Policies', desc: 'List all active insurance policies', icon: 'description', route: '/policies' },
    { label: 'Add New Policy', desc: 'Upload or manually add a policy', icon: 'add_circle', route: '/policies/new' },
    { label: 'Tax Planning', desc: 'Check 80C/80D benefits', icon: 'request_quote', route: '/tax-planner' },
    { label: 'Finance Insights', desc: 'View IRR & Portfolio yield', icon: 'insights', route: '/finance-insights' },
    { label: 'Family Members', desc: 'Manage family profiles', icon: 'groups', route: '/family-members' }
  ];

  filteredCommands: any[] = [];
  filteredPolicies: Policy[] = [];

  @ViewChild('searchInput') searchInput!: ElementRef;

  constructor(
    private router: Router,
    private aiService: AiService,
    private policyService: PolicyService,
    private elRef: ElementRef
  ) {}

  ngOnInit(): void {
    this.filteredCommands = [...this.commands];
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault();
      this.toggle();
    }

    if (event.key === 'Escape') {
      this.close();
    }

    if (this.isOpen && event.key === 'Tab') {
      this.handleTab(event);
    }
  }

  private handleTab(event: KeyboardEvent) {
    const focusableElements = this.elRef.nativeElement.querySelectorAll('input, .result-item, .command-esc');
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus();
        event.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus();
        event.preventDefault();
      }
    }
  }

  toggle() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      setTimeout(() => this.searchInput.nativeElement.focus(), 50);
    } else {
      this.reset();
    }
  }

  close() {
    this.isOpen = false;
    this.reset();
  }

  reset() {
    this.query = '';
    this.aiResponse = null;
    this.aiLoading = false;
    this.filteredPolicies = [];
    this.filteredCommands = [...this.commands];
  }

  onQueryChange() {
    if (!this.query) {
      this.reset();
      return;
    }

    this.filteredCommands = this.commands.filter(c => 
      c.label.toLowerCase().includes(this.query.toLowerCase()) ||
      c.desc.toLowerCase().includes(this.query.toLowerCase())
    );

    // If query looks like a question or is long enough, search policies too
    if (this.query.length > 2) {
      this.policyService.getPolicies({ searchTerm: this.query, pageSize: 5 } as any).subscribe(res => {
        this.filteredPolicies = res.data?.items || [];
      });
    }
  }

  handleEnter() {
    // If it looks like a question (ends with ? or contains specific keywords), trigger AI
    const q = this.query.toLowerCase();
    if (q.endsWith('?') || q.includes('how many') || q.includes('what is') || q.includes('show me')) {
      this.triggerAi();
    } else if (this.filteredCommands.length > 0) {
      this.executeCommand(this.filteredCommands[0]);
    }
  }

  triggerAi() {
    this.aiLoading = true;
    this.aiResponse = null;
    this.aiService.queryPortfolio(this.query).subscribe({
      next: (res) => {
        this.aiResponse = res.data;
        this.aiLoading = false;
      },
      error: () => {
        this.aiLoading = false;
        this.aiResponse = "Sorry, I couldn't process that question.";
      }
    });
  }

  executeCommand(cmd: any) {
    this.router.navigate([cmd.route]);
    this.close();
  }

  navigateToPolicy(id: number) {
    this.router.navigate(['/policies', id]);
    this.close();
  }
}
