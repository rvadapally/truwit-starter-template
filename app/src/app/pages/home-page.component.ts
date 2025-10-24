import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="home-page">
      <section class="hero">
        <div class="container">
          <div class="hero-content">
            <h1>Where Provenance<br>Meets Proof</h1>
            <p class="hero-subtitle">
              Redefining trust in the age of AI. Truwit is the lightweight verification layer for digital media—attaching
              cryptographic provenance, consent, and authenticity to AI-generated or user-created content.
            </p>
            <div class="hero-actions">
              <a routerLink="/verify/tool" class="btn-primary">Start Verification</a>
            </div>
          </div>
          <div class="hero-visual">
            <p class="preview-text">Preview coming soon</p>
          </div>
        </div>
      </section>

      <section class="features">
        <div class="container">
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">🛡️</div>
              <h3>Cryptographic Proof</h3>
              <p>Immutable, verifiable attestations for your media.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🤝</div>
              <h3>Consent Tracking</h3>
              <p>Prove likeness/rights with traceable consent.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">✨</div>
              <h3>AI Detection</h3>
              <p>Identify and label AI-assisted or generated content.</p>
            </div>
          </div>
        </div>
      </section>

      <section class="cta-final">
        <div class="container">
          <h2>Verify origin. Prove consent. Publish with confidence.</h2>
          <div class="cta-actions">
            <a routerLink="/verify/tool" class="btn-primary">Start Verification</a>
          </div>
          <p class="privacy-note">We hash locally. Your files are not stored.</p>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .home-page {
      min-height: 100vh;
      background: var(--bg-0);
      color: var(--text-primary);
    }

    .hero {
      padding: 4rem 0;
      text-align: center;
      background: linear-gradient(135deg, var(--bg-1) 0%, var(--bg-2) 100%);
    }

    .container {
      max-width: var(--w-container);
      margin: 0 auto;
      padding: 0 1.5rem;
    }

    .hero h1 {
      font-size: clamp(2rem, 5vw, 3.5rem);
      font-weight: 700;
      line-height: 1.2;
      margin: 0 0 1rem 0;
      background: linear-gradient(135deg, var(--teal), #2de2b5);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .hero-subtitle {
      font-size: 1.25rem;
      color: var(--text-secondary);
      max-width: 700px;
      margin: 0 auto 2rem;
      line-height: 1.6;
    }

    .hero-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    .btn-primary, .btn-secondary {
      padding: 0.875rem 2rem;
      border-radius: var(--radius);
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s ease;
      display: inline-block;
      font-size: 1.05rem;
    }

    .btn-primary {
      background: linear-gradient(135deg, var(--teal), var(--teal-600));
      color: #0B1116;
      box-shadow: 0 4px 12px rgba(34, 224, 195, 0.25);
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(34, 224, 195, 0.35);
    }

    .btn-secondary {
      background: transparent;
      color: var(--teal);
      border: 2px solid var(--teal);
    }

    .btn-secondary:hover {
      background: var(--teal);
      color: #0B1116;
    }

    .features {
      padding: 4rem 0;
      background: var(--bg-0);
    }

    .features h2 {
      text-align: center;
      font-size: 2.5rem;
      margin: 0 0 3rem;
      color: var(--text-primary);
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
    }

    .feature-card {
      padding: 2rem;
      background: var(--bg-1);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      text-align: center;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .feature-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(34, 224, 195, 0.15);
    }

    .feature-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .feature-card h3 {
      font-size: 1.25rem;
      color: var(--text-primary);
      margin: 0 0 0.75rem;
    }

    .feature-card p {
      color: var(--text-secondary);
      margin: 0;
      line-height: 1.6;
    }

    .cta {
      padding: 4rem 0;
      text-align: center;
      background: var(--bg-1);
    }

    .cta h2 {
      font-size: 2.5rem;
      margin: 0 0 1rem;
      color: var(--text-primary);
    }

    .cta p {
      font-size: 1.125rem;
      color: var(--text-secondary);
      margin: 0 0 2rem;
    }

    @media (max-width: 768px) {
      .hero-actions {
        flex-direction: column;
        align-items: center;
      }

      .features-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class HomePageComponent implements OnInit {
  constructor(
    private title: Title,
    private meta: Meta
  ) {}

  ngOnInit(): void {
    this.title.setTitle('TruWit - Content Verification and Authenticity Platform');
    this.meta.updateTag({
      name: 'description',
      content: 'Verify digital content authenticity with TruWit. Cryptographic proof, AI detection, and C2PA compliance for trust in the age of AI.'
    });
  }
}

