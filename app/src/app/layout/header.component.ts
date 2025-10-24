import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
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
          <a routerLink="/investors" class="nav-link">Investors</a>
          <a routerLink="/verify/tool" class="btn-launch">Launch App</a>
        </div>
      </nav>
    </header>
  `,
  styles: [`
    .header {
      background: var(--bg-1);
      border-bottom: 1px solid var(--border);
      padding: 1rem 0;
      position: sticky;
      top: 0;
      z-index: 1000;
    }

    .nav {
      max-width: var(--w-container);
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 1.5rem;
    }

    .nav-brand {
      display: flex;
      align-items: center;
    }

    .logo-link {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      text-decoration: none;
      color: var(--text-primary);
    }

    .nav-logo {
      width: 32px;
      height: 32px;
    }

    .brand-name {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--teal);
    }

    .nav-menu {
      display: flex;
      align-items: center;
      gap: 2rem;
    }

    .nav-link {
      color: var(--text-secondary);
      text-decoration: none;
      font-weight: 500;
      padding: 0.5rem 0;
      transition: color 0.2s ease;
      white-space: nowrap;
    }

    .nav-link:hover {
      color: var(--teal);
    }

    .btn-launch {
      padding: 0.625rem 1.5rem;
      background: var(--teal);
      color: var(--bg-0);
      text-decoration: none;
      border-radius: var(--radius);
      font-weight: 600;
      transition: all 0.2s ease;
      white-space: nowrap;
    }

    .btn-launch:hover {
      background: #13c4bc;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(20, 212, 201, 0.3);
    }

    @media (max-width: 768px) {
      .nav {
        flex-direction: column;
        gap: 1rem;
      }

      .nav-menu {
        flex-direction: column;
        gap: 1rem;
        width: 100%;
      }

      .dropdown-menu {
        position: static;
        box-shadow: none;
        border: none;
        margin-top: 0;
      }
    }
  `]
})
export class HeaderComponent {
  showProductsDropdown = false;
}

