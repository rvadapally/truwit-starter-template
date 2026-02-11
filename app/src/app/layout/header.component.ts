import { Component, inject, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  styleUrls: ['./header.component.scss'],
  template: `
    <header class="header">
      <nav class="nav">
        <div class="nav-top">
          <div class="nav-brand">
            <a routerLink="/" class="logo-link" (click)="closeMenu()">
              <img src="/assets/logo.svg" alt="TruWit Logo" class="nav-logo">
              <span class="brand-name">TruWit</span>
            </a>
          </div>
          
          <button class="hamburger" (click)="toggleMenu()" [class.active]="menuOpen" aria-label="Toggle menu">
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
          </button>
        </div>
        
        <div class="nav-menu" [class.open]="menuOpen">
          <a routerLink="/" class="nav-link" (click)="closeMenu()">Home</a>
          <a routerLink="/how-it-works" class="nav-link" (click)="closeMenu()">How It Works</a>
          <a routerLink="/use-cases" class="nav-link" (click)="closeMenu()">Use Cases</a>
          <a routerLink="/technology" class="nav-link" (click)="closeMenu()">Technology</a>
          <a routerLink="/pricing" class="nav-link" (click)="closeMenu()">Pricing</a>
          <a routerLink="/products" class="nav-link" (click)="closeMenu()">Products</a>
          
          <!-- Show Login or User Info -->
          <a *ngIf="!currentUser" routerLink="/login" class="btn-login" (click)="closeMenu()">Sign In</a>
          <div *ngIf="currentUser" class="user-menu">
            <span class="user-info">{{ getUserDisplay() }}</span>
            <button (click)="signOut(); closeMenu()" class="btn-signout">Sign Out</button>
          </div>
          
          <a routerLink="/verify" class="btn-launch" (click)="closeMenu()">Try It Free</a>
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
  private router = inject(Router);
  currentUser = this.authService.getCurrentUser();
  menuOpen = false;

  ngOnInit() {
    // Subscribe to auth changes
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    // Close menu on route change
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.closeMenu();
    });
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.nav') && this.menuOpen) {
      this.closeMenu();
    }
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

