import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-logo',
  standalone: true,
  imports: [RouterModule, CommonModule],
  template: `
    <a routerLink="/" class="logo-link">
      <img src="/assets/logo.svg" alt="TruWit - Where Provenance Meets Proof" class="logo" />
    </a>
  `,
  styles: [`
    .logo-link {
      display: flex;
      align-items: center;
      text-decoration: none;
      transition: var(--transition-fast);
    }
    
    .logo {
      height: 40px; /* desktop */
      filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.4));
      transition: var(--transition-fast);
      
      &:hover {
        transform: scale(1.05);
        filter: drop-shadow(0 0 4px var(--color-accent-primary));
      }
      
      @media (max-width: 768px) {
        height: 32px; /* mobile */
      }
    }
  `]
})
export class LogoComponent {}
