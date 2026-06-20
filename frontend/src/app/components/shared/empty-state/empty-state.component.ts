import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="empty-state-container" [style.min-height]="height">
      <div class="icon-wrapper">
        <span class="material-icons-round">{{ icon }}</span>
      </div>
      <h3 class="title">{{ title }}</h3>
      <p class="description">{{ description }}</p>
      
      <button *ngIf="actionLabel" class="btn btn-primary mt-lg" (click)="actionClicked.emit()">
        <span class="material-icons-round" *ngIf="actionIcon">{{ actionIcon }}</span>
        {{ actionLabel }}
      </button>
    </div>
  `,
  styles: [`
    .empty-state-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--space-2xl);
      text-align: center;
      width: 100%;
    }

    .icon-wrapper {
      width: 80px;
      height: 80px;
      border-radius: var(--radius-lg);
      background: var(--surface-card);
      border: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: var(--space-lg);
      color: var(--text-muted);
    }

    .icon-wrapper span {
      font-size: 40px;
    }

    .title {
      font-size: var(--font-size-xl);
      font-weight: 700;
      color: var(--text-main);
      margin-bottom: var(--space-xs);
    }

    .description {
      color: var(--text-muted);
      font-size: var(--font-size-sm);
      max-width: 320px;
      line-height: 1.6;
    }

    .mt-lg {
      margin-top: var(--space-lg);
    }
  `]
})
export class EmptyStateComponent {
  @Input() icon: string = 'search_off';
  @Input() title: string = 'No results found';
  @Input() description: string = 'Try adjusting your search or filters to find what you’re looking for.';
  @Input() actionLabel?: string;
  @Input() actionIcon?: string;
  @Input() height: string = '300px';

  @Output() actionClicked = new EventEmitter<void>();
}
