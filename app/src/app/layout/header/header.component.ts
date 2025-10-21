import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LogoComponent } from '../../shared/components/logo/logo.component';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule, CommonModule, LogoComponent, ThemeToggleComponent],
  template: `
    <header class="tw-header">
      <div class="container">
        <app-logo></app-logo>
        <nav class="nav-links">
          <a routerLink="/" aria-label="Home">Home</a>
          <a routerLink="/about" aria-label="About">About</a>
          <a routerLink="/app/#/verify" aria-label="Verify Content">Verify</a>
          <app-theme-toggle></app-theme-toggle>
        </nav>
      </div>
    </header>
  `,
  styles: [`
    .tw-header {
      background: var(--color-bg-primary);
      border-bottom: 1px solid var(--border-color);
      height: 80px;
      position: sticky;
      top: 0;
      z-index: 100;
      
      .container {
        max-width: var(--container-max);
        margin: 0 auto;
        padding: 0 var(--gap-lg);
        display: flex;
        justify-content: space-between;
        align-items: center;
        height: 100%;
      }
      
      .nav-links a {
        color: var(--color-text-secondary);
        margin-left: 2rem;
        text-decoration: none;
        transition: var(--transition-fast);
        
        &:hover {
          color: var(--color-accent-primary);
        }
      }
    }
  `]
})
export class HeaderComponent {}
