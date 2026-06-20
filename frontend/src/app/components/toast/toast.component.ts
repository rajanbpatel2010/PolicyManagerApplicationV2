import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastMessage } from '../../services/toast.service';

@Component({
    selector: 'app-toast',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="toast-container">
      <div *ngFor="let toast of toasts"
           class="toast toast-{{ toast.type }}"
           (click)="dismiss(toast.id)">
        <span class="material-icons-round toast-icon">
          {{ toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : 'info' }}
        </span>
        <span class="toast-message">{{ toast.message }}</span>
        <span class="material-icons-round toast-close">close</span>
      </div>
    </div>
  `,
    styles: [`
    .toast-icon { font-size: 20px; flex-shrink: 0; }
    .toast-message { flex: 1; font-size: 0.875rem; font-weight: 500; }
    .toast-close {
      font-size: 16px;
      cursor: pointer;
      opacity: 0.6;
      flex-shrink: 0;
    }
    .toast-close:hover { opacity: 1; }
  `]
})
export class ToastComponent {
    toasts: ToastMessage[] = [];

    constructor(private toastService: ToastService) {
        this.toastService.toasts$.subscribe(toasts => this.toasts = toasts);
    }

    dismiss(id: number): void {
        this.toastService.dismiss(id);
    }
}
