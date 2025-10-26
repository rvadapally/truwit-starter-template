import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <div class="logo">
            <svg width="48" height="48" viewBox="0 0 100 100" fill="none">
              <circle cx="50" cy="50" r="45" fill="#14D4C9"/>
              <path d="M30 50 L45 65 L70 35" stroke="white" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h1>Sign in to Truwit</h1>
          <p class="subtitle">Choose how you'd like to continue</p>
        </div>

        <div class="login-options">
          <!-- Twitter Sign-In -->
          <button class="login-btn twitter-btn" (click)="signInWithTwitter()">
            <svg class="btn-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            <span>Continue with X</span>
          </button>

          <!-- Google Sign-In -->
          <button class="login-btn google-btn" (click)="signInWithGoogle()">
            <svg class="btn-icon" width="24" height="24" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          <!-- Divider -->
          <div class="divider">
            <span>or</span>
          </div>

          <!-- Anonymous Sign-In -->
          <button class="login-btn anonymous-btn" (click)="signInAnonymously()" [disabled]="loading">
            <svg class="btn-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <span>{{ loading ? 'Signing in...' : 'Continue as Guest' }}</span>
          </button>
        </div>

        <div class="login-footer">
          <p class="privacy-note">
            By continuing, you agree to Truwit's 
            <a href="/privacy" target="_blank">Privacy Policy</a> and 
            <a href="/terms" target="_blank">Terms of Service</a>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem;
    }

    .login-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      max-width: 440px;
      width: 100%;
      padding: 3rem;
      animation: slideUp 0.4s ease-out;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .login-header {
      text-align: center;
      margin-bottom: 2.5rem;
    }

    .logo {
      margin: 0 auto 1.5rem;
      display: flex;
      justify-content: center;
    }

    h1 {
      font-size: 1.875rem;
      font-weight: 700;
      color: #1a202c;
      margin: 0 0 0.5rem 0;
    }

    .subtitle {
      font-size: 1rem;
      color: #718096;
      margin: 0;
    }

    .login-options {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .login-btn {
      width: 100%;
      padding: 0.875rem 1.5rem;
      border-radius: 8px;
      border: 2px solid #e2e8f0;
      background: white;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
    }

    .login-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .login-btn:active:not(:disabled) {
      transform: translateY(0);
    }

    .login-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-icon {
      width: 24px;
      height: 24px;
      flex-shrink: 0;
    }

    .twitter-btn {
      color: #000000;
      border-color: #000000;
    }

    .twitter-btn:hover:not(:disabled) {
      background: #000000;
      color: white;
    }

    .google-btn {
      color: #1a202c;
      border-color: #e2e8f0;
    }

    .google-btn:hover:not(:disabled) {
      background: #f7fafc;
      border-color: #cbd5e0;
    }

    .anonymous-btn {
      color: #667eea;
      border-color: #667eea;
    }

    .anonymous-btn:hover:not(:disabled) {
      background: #667eea;
      color: white;
    }

    .divider {
      display: flex;
      align-items: center;
      text-align: center;
      color: #a0aec0;
      margin: 0.5rem 0;
    }

    .divider::before,
    .divider::after {
      content: '';
      flex: 1;
      border-bottom: 1px solid #e2e8f0;
    }

    .divider span {
      padding: 0 1rem;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .login-footer {
      margin-top: 2rem;
      text-align: center;
    }

    .privacy-note {
      font-size: 0.875rem;
      color: #718096;
      line-height: 1.5;
      margin: 0;
    }

    .privacy-note a {
      color: #667eea;
      text-decoration: none;
      font-weight: 500;
    }

    .privacy-note a:hover {
      text-decoration: underline;
    }

    @media (max-width: 480px) {
      .login-card {
        padding: 2rem 1.5rem;
      }

      h1 {
        font-size: 1.5rem;
      }

      .login-btn {
        padding: 0.75rem 1.25rem;
        font-size: 0.9375rem;
      }
    }
  `]
})
export class LoginPageComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  loading = false;

  signInWithTwitter(): void {
    console.log('🐦 Twitter sign-in clicked');
    this.authService.signInWithTwitter();
  }

  signInWithGoogle(): void {
    console.log('🔵 Google sign-in clicked');
    this.authService.signInWithGoogle();
  }

  signInAnonymously(): void {
    console.log('👤 Anonymous sign-in clicked');
    this.loading = true;
    this.authService.signInAnonymously().subscribe({
      next: (identity) => {
        console.log('✅ Anonymous sign-in successful:', identity);
        this.loading = false;
        // Redirect to verify page or return URL
        const returnUrl = sessionStorage.getItem('truwit_return_url') || '/verify';
        sessionStorage.removeItem('truwit_return_url');
        this.router.navigateByUrl(returnUrl);
      },
      error: (error) => {
        console.error('❌ Anonymous sign-in failed:', error);
        this.loading = false;
        alert('Failed to sign in anonymously. Please try again.');
      }
    });
  }
}

