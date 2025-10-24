import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <footer class="footer">
      <div class="footer-container">
        <div class="footer-content">
          <div class="footer-section">
            <h3 class="footer-title">TruWit</h3>
            <p class="footer-text">Content verification and authenticity platform</p>
          </div>
          
          <div class="footer-section">
            <h4 class="footer-heading">Legal</h4>
            <a routerLink="/legal/privacy" class="footer-link">Privacy Policy</a>
            <a routerLink="/legal/terms" class="footer-link">Terms of Service</a>
          </div>
          
          <div class="footer-section">
            <h4 class="footer-heading">Products</h4>
            <a routerLink="/truviz" class="footer-link">TruWit</a>
            <a routerLink="/audit" class="footer-link">TruWit Audit</a>
            <a routerLink="/products" class="footer-link">Compare</a>
          </div>
          
          <div class="footer-section verified-section">
            <img src="/assets/verified-circular-badge.jpg" alt="TruWit Verified" class="verified-badge">
            <p class="verified-text">Verified by TruWit</p>
          </div>
        </div>
        
        <div class="footer-bottom">
          <p class="copyright">© {{ currentYear }} TruWit. All rights reserved.</p>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .footer {
      background: var(--bg-1);
      border-top: 1px solid var(--border);
      padding: 3rem 0 1.5rem;
      margin-top: auto;
    }

    .footer-container {
      max-width: var(--w-container);
      margin: 0 auto;
      padding: 0 1.5rem;
    }

    .footer-content {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr;
      gap: 2rem;
      margin-bottom: 2rem;
    }

    .footer-section {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .footer-title {
      font-size: 1.5rem;
      font-weight: 700;
      background: linear-gradient(135deg, var(--teal), #2de2b5);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin: 0;
    }

    .footer-text {
      color: var(--text-muted);
      margin: 0;
      line-height: 1.6;
    }

    .footer-heading {
      color: var(--text-primary);
      font-size: 0.9rem;
      font-weight: 600;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .footer-link {
      color: var(--text-secondary);
      text-decoration: none;
      font-size: 0.95rem;
      transition: color 0.2s ease;
    }

    .footer-link:hover {
      color: var(--teal);
    }

    .verified-section {
      align-items: center;
      text-align: center;
    }

    .verified-badge {
      width: 80px;
      height: 80px;
      border-radius: 50%;
    }

    .verified-text {
      color: var(--text-muted);
      font-size: 0.85rem;
      margin: 0;
    }

    .footer-bottom {
      padding-top: 2rem;
      border-top: 1px solid var(--border);
      text-align: center;
    }

    .copyright {
      color: var(--text-muted);
      font-size: 0.9rem;
      margin: 0;
    }

    @media (max-width: 768px) {
      .footer-content {
        grid-template-columns: 1fr;
        gap: 2rem;
      }

      .verified-section {
        order: -1;
      }
    }
  `]
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
}

