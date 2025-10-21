import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer class="tw-footer">
      <div class="container">
        <div class="footer-left">
          <img src="assets/verified-circular-badge.jpg" 
               alt="Verified by TruWit" 
               class="verified-badge" />
          <p class="footer-text">
            © 2025 TruWit — Provenance. Proof. Trust.
          </p>
        </div>
        <div class="footer-links">
          <a href="/privacy" aria-label="Privacy Policy">Privacy</a>
          <a href="/terms" aria-label="Terms of Service">Terms</a>
          <a href="/docs" aria-label="Documentation">Documentation</a>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .tw-footer {
      background: var(--color-bg-primary);
      border-top: 1px solid var(--border-color);
      padding: 2rem 0;
      
      .container {
        max-width: var(--container-max);
        margin: 0 auto;
        padding: 0 var(--gap-lg);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .footer-left {
        display: flex;
        align-items: center;
      }
      
      .verified-badge {
        width: 48px;
        height: 48px;
        margin-right: 1rem;
        box-shadow: var(--shadow-glow); /* Subtle glow effect */
      }
      
      .footer-text {
        color: var(--color-text-secondary);
        margin: 0;
      }
      
      .footer-links a {
        color: var(--color-text-secondary);
        margin-left: 1.5rem;
        text-decoration: none;
        transition: var(--transition-fast);
        
        &:hover {
          color: var(--color-accent-primary);
        }
      }
      
      @media (max-width: 768px) {
        .container {
          flex-direction: column;
          text-align: center;
          gap: 1rem;
        }
        
        .footer-links a {
          margin: 0 0.75rem;
        }
      }
    }
  `]
})
export class FooterComponent {}
