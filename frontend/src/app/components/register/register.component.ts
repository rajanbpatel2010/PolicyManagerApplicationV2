import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    template: `
    <div class="login-page">
      <div class="register-card glass-card" style="max-width:480px;width:100%">
        <div class="text-center">
          <span class="material-icons-round" style="font-size:40px;color:var(--color-primary-light)">person_add</span>
          <h2 class="mt-sm">Create Account</h2>
          <p class="text-muted" style="font-size:0.875rem">Join Policy Manager today</p>
        </div>

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="mt-lg">
          <div class="form-group">
            <label class="form-label" for="fullName">Full Name</label>
            <input id="fullName" type="text" class="form-control"
                   formControlName="fullName" placeholder="Enter your full name">
            <span class="form-error"
                  *ngIf="registerForm.get('fullName')?.invalid && registerForm.get('fullName')?.touched">
              Full name is required
            </span>
          </div>

          <div class="form-group">
            <label class="form-label" for="regEmail">Email Address</label>
            <input id="regEmail" type="email" class="form-control"
                   formControlName="email" placeholder="Enter your email">
            <span class="form-error"
                  *ngIf="registerForm.get('email')?.invalid && registerForm.get('email')?.touched">
              Please enter a valid email
            </span>
          </div>

          <div class="form-group">
            <label class="form-label" for="regPhone">Phone Number (optional)</label>
            <input id="regPhone" type="tel" class="form-control"
                   formControlName="phoneNumber" placeholder="e.g. 9876543210">
          </div>

          <div class="form-group">
            <label class="form-label" for="regPassword">Password</label>
            <input id="regPassword" type="password" class="form-control"
                   formControlName="password" placeholder="Min 6 characters">
            <span class="form-error"
                  *ngIf="registerForm.get('password')?.invalid && registerForm.get('password')?.touched">
              Password must be at least 6 characters
            </span>
          </div>

          <button type="submit" class="btn btn-primary btn-lg w-full mt-md"
                  [disabled]="registerForm.invalid || loading">
            <span class="spinner" style="width:18px;height:18px;border-width:2px" *ngIf="loading"></span>
            <span *ngIf="!loading">Create Account</span>
          </button>
        </form>

        <p class="text-center mt-lg" style="font-size:0.875rem">
          Already have an account? <a routerLink="/login">Sign In</a>
        </p>
      </div>
    </div>
  `,
    styles: [`
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      position: relative;
      z-index: 1;
    }
    .register-card { padding: 40px; }
  `]
})
export class RegisterComponent {
    registerForm: FormGroup;
    loading = false;

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router,
        private toast: ToastService
    ) {
        this.registerForm = this.fb.group({
            fullName: ['', [Validators.required]],
            email: ['', [Validators.required, Validators.email]],
            phoneNumber: [''],
            password: ['', [Validators.required, Validators.minLength(6)]]
        });
    }

    onSubmit(): void {
        if (this.registerForm.invalid) return;

        this.loading = true;
        this.authService.register(this.registerForm.value).subscribe({
            next: (res) => {
                this.loading = false;
                if (res.success) {
                    this.toast.success('Account created successfully! Welcome, ' + res.data.fullName);
                    this.router.navigate(['/dashboard']);
                }
            },
            error: () => {
                this.loading = false;
            }
        });
    }
}
