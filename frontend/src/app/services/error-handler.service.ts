import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { ToastService } from './toast.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(private injector: Injector) {}

  handleError(error: any): void {
    const toastService = this.injector.get(ToastService);
    
    // Log the error to console for debugging
    console.error('An unexpected error occurred:', error);

    // Provide a user-friendly message
    // const message = error.message ? error.message : error.toString();
    
    setTimeout(() => {
      toastService.error('Something went wrong. Please try again later.');
    });
  }
}
