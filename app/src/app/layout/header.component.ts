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
            <img src="/assets/truwit-logo.png" alt="TruWit Logo" class="nav-logo">
            <span class="brand-name">TruWit</span>
          </a>
        </div>
        
        <div class="nav-menu">
          <div class="nav-item" (mouseenter)="showProductsDropdown = true" (mouseleave)="showProductsDropdown = false">
            <button class="nav-link dropdown-toggle" type="button">
              Products
              <span class="dropdown-arrow">▼</span>
            </button>
            <div class="dropdown-menu" *ngIf="showProductsDropdown">
              <a routerLink="/truviz" class="dropdown-item">TruViz</a>
              <a routerLink="/audit" class="dropdown-item">TruViz Audit</a>
              <a routerLink="/products" class="dropdown-item">Compare</a>
            </div>
          </div>
          
          <a routerLink="/pricing" class="nav-link">Pricing</a>
          <a routerLink="/verify" class="nav-link">Verify</a>
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
      border-radius: 4px;
    }

    .brand-name {
      font-size: 1.5rem;
      font-weight: 700;
      background: linear-gradient(135deg, var(--teal), #2de2b5);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .nav-menu {
      display: flex;
      align-items: center;
      gap: 2rem;
    }

    .nav-item {
      position: relative;
    }

    .nav-link {
      color: var(--text-secondary);
      text-decoration: none;
      font-weight: 500;
      padding: 0.5rem 0;
      transition: color 0.2s ease;
      background: none;
      border: none;
      font-size: 1rem;
      cursor: pointer;
      font-family: inherit;
    }

    .nav-link:hover {
      color: var(--teal);
    }

    .dropdown-toggle {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .dropdown-arrow {
      font-size: 0.7em;
      transition: transform 0.2s ease;
    }

    .nav-item:hover .dropdown-arrow {
      transform: rotate(180deg);
    }

    .dropdown-menu {
      position: absolute;
      top: 100%;
      left: 0;
      background: var(--bg-2);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      min-width: 200px;
      padding: 0.5rem 0;
      margin-top: 0.5rem;
      z-index: 1000;
    }

    .dropdown-item {
      display: block;
      padding: 0.75rem 1.5rem;
      color: var(--text-primary);
      text-decoration: none;
      transition: background-color 0.2s ease;
    }

    .dropdown-item:hover {
      background: var(--bg-1);
      color: var(--teal);
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

