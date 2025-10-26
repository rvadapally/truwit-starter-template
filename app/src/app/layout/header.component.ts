import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  styleUrls: ['./header.component.scss'],
  template: `
    <header class="header">
      <nav class="nav">
        <div class="nav-brand">
          <a routerLink="/" class="logo-link">
            <img src="/assets/logo.svg" alt="TruWit Logo" class="nav-logo">
            <span class="brand-name">TruWit</span>
          </a>
        </div>
        
        <div class="nav-menu">
          <a routerLink="/" class="nav-link">Home</a>
          <a routerLink="/how-it-works" class="nav-link">How It Works</a>
          <a routerLink="/use-cases" class="nav-link">Use Cases</a>
          <a routerLink="/technology" class="nav-link">Technology</a>
          <a routerLink="/pricing" class="nav-link">Pricing</a>
          <a routerLink="/products" class="nav-link">Products</a>
          
          <!-- Show Login or User Info -->
          <a *ngIf="!currentUser" routerLink="/login" class="btn-login">Sign In</a>
          <div *ngIf="currentUser" class="user-menu">
            <span class="user-info">{{ getUserDisplay() }}</span>
            <button (click)="signOut()" class="btn-signout">Sign Out</button>
          </div>
          
          <a routerLink="/verify" class="btn-launch">Launch App</a>
        </div>
      </nav>
    </header>
  `,
  styles: [`
    .btn-login {
      padding: 0.5rem 1rem;
      background: transparent;
      color: #14D4C9;
      border: 2px solid #14D4C9;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 600;
      transition: all 0.3s ease;
    }

    .btn-login:hover {
      background: #14D4C9;
      color: white;
    }

    .user-menu {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .user-info {
      font-size: 0.875rem;
      color: #718096;
      font-weight: 500;
    }

    .btn-signout {
      padding: 0.5rem 1rem;
      background: transparent;
      color: #e53e3e;
      border: 2px solid #e53e3e;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-signout:hover {
      background: #e53e3e;
      color: white;
    }
  `]
})
export class HeaderComponent implements OnInit {
  private authService = inject(AuthService);
  currentUser = this.authService.getCurrentUser();

  ngOnInit() {
    // Subscribe to auth changes
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  getUserDisplay(): string {
    if (!this.currentUser) return '';
    if (this.currentUser.provider === 'anonymous') {
      return 'Guest';
    }
    return this.currentUser.display_name || this.currentUser.handle || 'User';
  }

  signOut(): void {
    this.authService.signOut();
  }
}

