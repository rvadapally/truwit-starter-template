import { Component, type OnInit } from '@angular/core';

@Component({
  selector: 'app-verify-page',
  template: `
    <div class="verification-page">
      <!-- Feature Showcase Section -->
      <div class="features-showcase">
        <h2 class="page-title">Content Verification</h2>
        <p class="page-subtitle">Verify authenticity and provenance with cryptographic proof</p>
        
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">🔒</div>
            <h3>Cryptographic Proof</h3>
            <p>Every verification is cryptographically signed</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">✅</div>
            <h3>Consent Tracking</h3>
            <p>Track and verify consent for likeness usage</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🎯</div>
            <h3>AI Detection</h3>
            <p>Identify and verify AI-generated content</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">
              <img src="assets/signed_badge.png" alt="Verified by Truwit" style="width: 48px; height: 48px; object-fit: contain;">
            </div>
            <h3>Show Trust</h3>
            <p>Use "Verified by Truwit" badges on posts, thumbnails, and sites</p>
          </div>
        </div>
      </div>

      <!-- Verification Form (shown when no result) -->
      <div class="verification-form" *ngIf="!verificationResult">
        <app-verification-form></app-verification-form>
      </div>
      
      <!-- Verification Result (shown when result exists) -->
      <div class="verification-result" *ngIf="verificationResult">
        <app-verification-result [result]="verificationResult"></app-verification-result>
        
        <div class="new-verification-section">
          <button class="btn-secondary" (click)="onNewVerification()">
            Verify Another Content
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .verification-page {
      padding: 2rem;
      max-width: 1000px;
      margin: 0 auto;
    }

    .features-showcase {
      text-align: center;
      margin-bottom: 3rem;
    }

    .page-title {
      font-size: 2rem;
      font-weight: 700;
      color: #0ea5e9;
      margin-bottom: 0.5rem;
    }

    .page-subtitle {
      font-size: 1.1rem;
      color: #9fb3d9;
      margin-bottom: 2rem;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .feature-card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 1.5rem;
      text-align: center;
      transition: all 0.3s ease;
    }

    .feature-card:hover {
      transform: translateY(-4px);
      border-color: rgba(14, 165, 233, 0.3);
      box-shadow: 0 10px 30px rgba(14, 165, 233, 0.1);
    }

    .feature-icon {
      font-size: 2.5rem;
      margin-bottom: 1rem;
    }

    .feature-card h3 {
      font-size: 1.1rem;
      font-weight: 600;
      color: #0ea5e9;
      margin-bottom: 0.5rem;
    }

    .feature-card p {
      font-size: 0.9rem;
      color: #9fb3d9;
      margin: 0;
    }
    
    .verification-form, .verification-result {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 2rem;
    }
    
    .new-verification-section {
      text-align: center;
      margin-top: 2rem;
    }
    
    .btn-secondary {
      background: rgba(255, 255, 255, 0.1);
      color: #e6eefc;
      border: 1px solid rgba(255, 255, 255, 0.2);
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.15);
    }

    @media (max-width: 768px) {
      .features-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .page-title {
        font-size: 1.75rem;
      }
    }
  `]
})
export class VerifyPageComponent implements OnInit {
  verificationResult: any = null;
  
  ngOnInit(): void {
    // Component initialized
  }
  
  onNewVerification(): void {
    this.verificationResult = null;
  }
}
