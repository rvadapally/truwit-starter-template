import { Component, type OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VerificationFormComponent } from './verification-form.component';

@Component({
  selector: 'app-verify-page',
  standalone: true,
  imports: [CommonModule, VerificationFormComponent],
  template: `
    <div class="verify-page">
      <div class="verify-container">
        <!-- Left Column: Features & Benefits -->
        <aside class="features-panel">
          <h1 class="hero-title">
            Verify origin. <span class="accent">Prove consent.</span> Publish with confidence.
          </h1>
          
          <p class="hero-subtitle">
            TruWit attaches cryptographic provenance, consent, and authenticity 
            to digital media. Verify the origin and prove consent for AI-generated content.
          </p>
          
          <div class="feature-cards">
            <div class="feature-card">
              <div class="feature-icon">🔒</div>
              <div class="feature-content">
                <h3>Cryptographic Proof</h3>
                <p>Immutable verification using blockchain technology</p>
              </div>
            </div>
            
            <div class="feature-card">
              <div class="feature-icon">✍️</div>
              <div class="feature-content">
                <h3>Consent Tracking</h3>
                <p>Track and verify consent for likeness usage</p>
              </div>
            </div>
            
            <div class="feature-card">
              <div class="feature-icon">🧠</div>
              <div class="feature-content">
                <h3>AI Detection</h3>
                <p>Identify and verify AI-generated content</p>
              </div>
            </div>
          </div>
          
          <div class="how-it-works">
            <h3>How It Works</h3>
            <ol>
              <li><strong>Upload</strong> your content or provide a URL</li>
              <li><strong>Verify</strong> cryptographic signatures and metadata</li>
              <li><strong>Share</strong> with proof badge and verification link</li>
            </ol>
          </div>
          
          <!-- Show verified badge in features panel -->
          <div class="trust-indicator">
            <img src="/assets/verified-circular-badge.jpg" alt="Verified by TruWit" class="trust-badge" />
            <p class="trust-text">Every verification is cryptographically signed</p>
          </div>
        </aside>
        
        <!-- Right Column: Verification Form -->
        <main class="verification-panel">
          <div class="form-card">
            <h2>Start Verification</h2>
            <p class="form-subtitle">Upload your content to begin</p>
            
            <!-- Existing form components here -->
            <app-verification-form></app-verification-form>
          </div>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .verify-page {
      background: var(--color-bg-primary);
      min-height: calc(100vh - 160px); /* Account for header + footer */
      padding: var(--gap-lg) 0;
    }

    .verify-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--gap-lg);
      max-width: var(--container-max);
      margin: 0 auto;
      padding: 0 var(--gap-lg);
    }

    /* Tablet - Still two columns, tighter gap */
    @media (max-width: 1200px) {
      .verify-container {
        gap: var(--gap-md);
      }
    }

    /* Mobile - Single column, form first */
    @media (max-width: 960px) {
      .verify-container {
        grid-template-columns: 1fr;
        gap: var(--gap-md);
      }
      
      .features-panel {
        order: 2; /* Form first on mobile */
      }
      
      .verification-panel {
        order: 1;
      }
    }

    .features-panel {
      padding: 2rem 0;
    }

    .hero-title {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 1rem;
      line-height: 1.2;
    }

    .hero-title .accent {
      color: var(--color-accent-primary);
    }

    .hero-subtitle {
      font-size: 1.125rem;
      color: var(--color-text-secondary);
      margin-bottom: 2rem;
      line-height: 1.6;
    }

    .feature-cards {
      display: flex;
      flex-direction: column;
      gap: var(--gap-md);
      margin: 2rem 0;
    }

    .feature-card {
      display: flex;
      gap: 1rem;
      padding: 1.25rem;
      background: var(--color-bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      transition: var(--transition-normal);
    }

    .feature-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
      border-color: var(--color-accent-primary);
    }

    .feature-icon {
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--color-accent-dark); /* From verified badge color */
      border-radius: 50%;
      font-size: 24px;
      flex-shrink: 0;
    }

    .feature-content h3 {
      margin: 0 0 0.5rem 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .feature-content p {
      margin: 0;
      color: var(--color-text-secondary);
      font-size: 0.9rem;
      line-height: 1.5;
    }

    .how-it-works {
      margin: 2rem 0;
      padding: 1.5rem;
      background: var(--color-bg-secondary);
      border-radius: var(--border-radius);
      border: 1px solid var(--border-color);
    }

    .how-it-works h3 {
      margin: 0 0 1rem 0;
      color: var(--color-text-primary);
      font-size: 1.25rem;
    }

    .how-it-works ol {
      margin: 0;
      padding-left: 1.5rem;
      color: var(--color-text-secondary);
    }

    .how-it-works li {
      margin-bottom: 0.5rem;
      line-height: 1.5;
    }

    .trust-indicator {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: rgba(0, 196, 204, 0.05);
      border: 1px solid var(--color-accent-primary);
      border-radius: var(--border-radius-sm);
      margin-top: 2rem;
    }

    .trust-badge {
      width: 32px;
      height: 32px;
      box-shadow: var(--shadow-glow);
    }

    .trust-text {
      color: var(--color-text-secondary);
      font-size: 0.9rem;
      margin: 0;
    }

    .verification-panel {
      padding: 2rem 0;
    }

    .form-card {
      background: var(--color-bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      padding: 2rem;
      box-shadow: var(--shadow-sm);
    }

    .form-card h2 {
      margin: 0 0 0.5rem 0;
      color: var(--color-text-primary);
      font-size: 1.75rem;
      font-weight: 600;
    }

    .form-subtitle {
      color: var(--color-text-secondary);
      margin: 0 0 2rem 0;
      font-size: 1rem;
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
