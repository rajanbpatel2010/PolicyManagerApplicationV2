import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="spinner-container" [class.overlay]="overlay" [style.height]="height">
      <div class="spinner" [style.width.px]="size" [style.height.px]="size"></div>
      <p *ngIf="message" class="spinner-message">{{ message }}</p>
    </div>
  `,
  styles: [`
    .spinner-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--space-md);
      width: 100%;
    }

    .spinner-container.overlay {
      position: absolute;
      inset: 0;
      background: rgba(2, 6, 23, 0.7);
      backdrop-filter: blur(4px);
      z-index: 100;
      border-radius: inherit;
    }

    .spinner {
      border: 3px solid var(--border-subtle);
      border-top-color: var(--action-primary);
      border-radius: var(--radius-full);
      animation: spin 0.8s linear infinite;
    }

    .spinner-message {
      color: var(--text-muted);
      font-size: var(--font-size-sm);
      font-weight: 500;
      letter-spacing: 0.05em;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class SpinnerComponent {
  @Input() size: number = 40;
  @Input() message: string = '';
  @Input() overlay: boolean = false;
  @Input() inline: boolean = false;
  @Input() height: string = 'auto';
}
