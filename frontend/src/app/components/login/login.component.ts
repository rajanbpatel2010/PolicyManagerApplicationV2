import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { trigger, style, transition, animate } from '@angular/animations';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { BiometricService } from '../../services/biometric.service';
import { ConfigService } from '../../services/config.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  animations: [
    trigger('expandCollapse', [
      transition(':enter', [
        style({ height: '0', opacity: 0, overflow: 'hidden' }),
        animate('300ms ease-out', style({ height: '*', opacity: 1 }))
      ]),
      transition(':leave', [
        style({ height: '*', opacity: 1, overflow: 'hidden' }),
        animate('300ms ease-in', style({ height: '0', opacity: 0 }))
      ])
    ])
  ],
  template: `
    <div class="login-page">
      <!-- Animated Background Shapes -->
      <div class="bg-shape shape-1"></div>
      <div class="bg-shape shape-2"></div>
      <div class="bg-shape shape-3"></div>

      <div class="login-container">
        <!-- Branding Section (Glassmorphism) -->
        <div class="login-branding">
          <div class="branding-content">
            <div class="logo-wrapper">
              <span class="material-icons-round brand-logo">shield</span>
            </div>
            <h1>Policy<span class="highlight">Manager</span></h1>
            <p class="tagline">Secure. Smart. Seamless.</p>
            
            <div class="features-list">
              <div class="feature-item">
                <div class="feature-icon"><span class="material-icons-round">verified_user</span></div>
                <div class="feature-text">
                  <h3>Secure Vault</h3>
                  <p>Enterprise-grade encryption for all your policies.</p>
                </div>
              </div>
              <div class="feature-item">
                <div class="feature-icon"><span class="material-icons-round">auto_awesome</span></div>
                <div class="feature-text">
                  <h3>AI Insights</h3>
                  <p>Smart analysis and coverage forecasting.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Form Section -->
        <div class="login-form-panel">
          <div class="form-wrapper">
            <div class="form-header">
              <h2>Welcome Back</h2>
              <p>Sign in to your digital insurance hub</p>
            </div>

            <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="modern-form">
              <div class="form-field">
                <label for="email">Email Address</label>
                <div class="input-container">
                  <span class="material-icons-round field-icon">alternate_email</span>
                  <input id="email" type="email" formControlName="email" placeholder="name@company.com" autocomplete="email">
                </div>
              </div>

              <div class="form-field">
                <label for="password">Password</label>
                <div class="input-container">
                  <span class="material-icons-round field-icon">lock_open</span>
                  <input id="password" [type]="showPassword ? 'text' : 'password'" formControlName="password" placeholder="••••••••" autocomplete="current-password">
                  <button type="button" class="eye-toggle" (click)="showPassword = !showPassword">
                    <span class="material-icons-round">{{ showPassword ? 'visibility_off' : 'visibility' }}</span>
                  </button>
                </div>
              </div>

              <div class="form-actions">
                <label class="custom-checkbox">
                  <input type="checkbox" formControlName="rememberMe">
                  <span class="checkmark"></span>
                  <span class="label-text">Remember me</span>
                </label>
                <button type="button" class="btn-link" (click)="showServerSettings = !showServerSettings">
                  <span class="material-icons-round">dvr</span>
                  Server
                </button>
              </div>

              <!-- Server Settings (Glass Dropdown) -->
              <div class="server-dropdown" *ngIf="showServerSettings" [@expandCollapse]>
                <div class="dropdown-inner">
                  <label>API Endpoint IP</label>
                  <div class="inline-group">
                    <input type="text" [(ngModel)]="serverIp" [ngModelOptions]="{standalone: true}" placeholder="192.168.x.x">
                    <button type="button" (click)="saveServerSettings()">Sync</button>
                  </div>
                  <small>Active: {{ currentApiUrl }}</small>
                </div>
              </div>

              <div class="submit-area">
                <button type="submit" class="btn-premium" [disabled]="loginForm.invalid || loading">
                  <span class="btn-content" *ngIf="!loading">
                    Authorize Access
                    <span class="material-icons-round">arrow_forward</span>
                  </span>
                  <div class="loader" *ngIf="loading"></div>
                </button>

                <button type="button" class="btn-biometric" *ngIf="canUseBiometric" (click)="onBiometricLogin()" [disabled]="loading">
                  <span class="material-icons-round">fingerprint</span>
                </button>
              </div>
            </form>

            <div class="form-footer">
              <p>New to PolicyManager? <a routerLink="/register">Create Account</a></p>
              

            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './login.component.css'
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  showPassword = false;
  canUseBiometric = false;
  showServerSettings = false;
  serverIp = '';

   constructor(
     private fb: FormBuilder,
     private authService: AuthService,
     private biometricService: BiometricService,
     private config: ConfigService,
     private router: Router,
     private route: ActivatedRoute,
     private toast: ToastService
   ) {
     this.loginForm = this.fb.group({
       email: ['rajanbpatel2017@gmail.com', [Validators.required, Validators.email]],
       password: ['Admin@123', [Validators.required, Validators.minLength(6)]],
       rememberMe: [false]
     });
   }
 
   async ngOnInit() {
     this.canUseBiometric = await this.biometricService.isAvailable() && this.biometricService.hasBiometricEnabled();
     this.serverIp = this.extractIp(this.config.getApiUrl());
     
     // Auto-trigger biometric if available
     if (this.canUseBiometric) {
       setTimeout(() => this.onBiometricLogin(), 500);
     }
   }

   get currentApiUrl() {
     return this.config.getApiUrl();
   }

   saveServerSettings() {
     if (this.serverIp) {
       this.config.setApiUrl(this.serverIp);
       this.toast.success('Server settings updated');
       this.showServerSettings = false;
     }
   }

   private extractIp(url: string): string {
     try {
       const regex = /http[s]?:\/\/([^:/]+)/;
       const match = url.match(regex);
       return match ? match[1] : '';
     } catch {
       return '';
     }
   }
 
   async onBiometricLogin() {
     const success = await this.biometricService.authenticate();
     if (success) {
       const creds = await this.biometricService.getCredentials();
       if (creds) {
         this.loading = true;
         this.authService.login({ email: creds.username, password: creds.password, rememberMe: true }).subscribe({
           next: (res) => {
             this.loading = false;
             if (res.success) {
               this.toast.success('Signed in with biometrics');
               this.navigateToReturnUrl();
             }
           },
           error: () => this.loading = false
         });
       }
     }
   }
 
   onSubmit(): void {
     console.log('Login attempt started');
     if (this.loginForm.invalid) {
       console.warn('Login form invalid:', this.loginForm.errors);
       this.toast.error('Please fill in all required fields correctly.');
       return;
     }
 
     this.loading = true;
     const formData = this.loginForm.value;
     console.log('Authenticating with URL:', this.config.getApiUrl());

     this.authService.login(formData).subscribe({
       next: (res) => {
         console.log('Login response received:', res);
         this.loading = false;
         if (res.success) {
           // Save for biometric if requested
           if (formData.rememberMe) {
             this.biometricService.setCredentials(formData.email, formData.password);
           }
           
           this.toast.success('Welcome back, ' + res.data.fullName + '!');
           this.navigateToReturnUrl();
         }
       },
       error: (err) => {
         console.error('Login failed error:', err);
         this.loading = false;
         this.toast.error('Connection failed. Please check your internet and server settings.');
       }
     });
   }
 
   private navigateToReturnUrl() {
     const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
     this.router.navigateByUrl(returnUrl);
   }

}
