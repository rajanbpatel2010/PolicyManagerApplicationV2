import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ToastMessage {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
    private toasts: ToastMessage[] = [];
    private toastsSubject = new BehaviorSubject<ToastMessage[]>([]);
    private nextId = 0;

    toasts$ = this.toastsSubject.asObservable();

    success(message: string): void {
        this.show(message, 'success');
    }

    error(message: string): void {
        this.show(message, 'error');
    }

    info(message: string): void {
        this.show(message, 'info');
    }

    private show(message: string, type: 'success' | 'error' | 'info'): void {
        const toast: ToastMessage = { id: this.nextId++, message, type };
        this.toasts.push(toast);
        this.toastsSubject.next([...this.toasts]);

        // Auto-dismiss after 4 seconds
        setTimeout(() => this.dismiss(toast.id), 4000);
    }

    dismiss(id: number): void {
        this.toasts = this.toasts.filter(t => t.id !== id);
        this.toastsSubject.next([...this.toasts]);
    }
}
