import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-use-cases-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="use-cases-page">
      <section class="hero">
        <div class="container">
          <p class="section-label">USE CASES</p>
          <h1>Built for Real-World Verification</h1>
          <p class="hero-subtitle">From content creators to enterprises, TruWit protects authenticity across industries</p>
        </div>
      </section>

      <section class="use-cases">
        <div class="container">
          <div class="use-case-grid">
            <div class="use-case-card">
              <div class="use-case-icon">🎥</div>
              <h3>Content Creators</h3>
              <p>Protect your original work from unauthorized use and prove ownership of your creative content.</p>
              <ul class="benefits-list">
                <li>Sign videos before publishing</li>
                <li>Prove original authorship</li>
                <li>Track consent for likeness usage</li>
              </ul>
            </div>

            <div class="use-case-card">
              <div class="use-case-icon">📰</div>
              <h3>News & Media</h3>
              <p>Verify the authenticity of source material and maintain trust with your audience.</p>
              <ul class="benefits-list">
                <li>Verify uploaded content</li>
                <li>Detect AI-generated media</li>
                <li>Maintain editorial integrity</li>
              </ul>
            </div>

            <div class="use-case-card">
              <div class="use-case-icon">🏢</div>
              <h3>Enterprise</h3>
              <p>Secure your brand assets and verify the provenance of business-critical media.</p>
              <ul class="benefits-list">
                <li>Brand protection</li>
                <li>Compliance documentation</li>
                <li>Supply chain verification</li>
              </ul>
            </div>

            <div class="use-case-card">
              <div class="use-case-icon">⚖️</div>
              <h3>Legal & Compliance</h3>
              <p>Create tamper-evident records and cryptographic evidence for legal proceedings.</p>
              <ul class="benefits-list">
                <li>Immutable audit trails</li>
                <li>Timestamp verification</li>
                <li>Chain of custody</li>
              </ul>
            </div>

            <div class="use-case-card">
              <div class="use-case-icon">🎓</div>
              <h3>Education & Research</h3>
              <p>Ensure academic integrity and verify the authenticity of research materials.</p>
              <ul class="benefits-list">
                <li>Research attribution</li>
                <li>Academic integrity</li>
                <li>Thesis verification</li>
              </ul>
            </div>

            <div class="use-case-card">
              <div class="use-case-icon">🛡️</div>
              <h3>Social Platforms</h3>
              <p>Combat misinformation and deepfakes by verifying user-generated content.</p>
              <ul class="benefits-list">
                <li>AI detection</li>
                <li>Misinformation prevention</li>
                <li>User trust building</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section class="cta">
        <div class="container">
          <h2>Ready to protect your content?</h2>
          <p>Start verifying authenticity with TruWit today</p>
          <a routerLink="/verify/tool" class="btn-primary">Get Started</a>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .use-cases-page {
      min-height: 100vh;
      background: var(--bg-0);
      color: var(--text-primary);
    }

    .hero {
      padding: 3rem 0 2rem;
      text-align: center;
    }

    .section-label {
      color: var(--teal);
      font-size: 0.875rem;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      margin-bottom: 0.5rem;
    }

    .container {
      max-width: var(--w-container);
      margin: 0 auto;
      padding: 0 1.5rem;
    }

    h1 {
      font-size: clamp(2rem, 4vw, 2.5rem);
      font-weight: 700;
      margin: 0 0 1rem 0;
    }

    .hero-subtitle {
      font-size: 1.1rem;
      color: var(--text-secondary);
      max-width: 700px;
      margin: 0 auto;
    }

    .use-cases {
      padding: 3rem 0;
    }

    .use-case-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 2rem;
      margin-top: 2rem;
    }

    .use-case-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: var(--radius);
      padding: 2rem;
      transition: all 0.3s ease;
    }

    .use-case-card:hover {
      transform: translateY(-4px);
      border-color: rgba(14, 165, 233, 0.3);
      box-shadow: 0 10px 30px rgba(14, 165, 233, 0.1);
    }

    .use-case-icon {
      font-size: 2.5rem;
      margin-bottom: 1rem;
    }

    .use-case-card h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 1rem 0;
    }

    .use-case-card p {
      color: var(--text-secondary);
      line-height: 1.6;
      margin: 0 0 1.5rem 0;
    }

    .benefits-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .benefits-list li {
      padding: 0.5rem 0;
      color: var(--text-secondary);
      position: relative;
      padding-left: 1.5rem;
    }

    .benefits-list li::before {
      content: '✓';
      position: absolute;
      left: 0;
      color: var(--teal);
      font-weight: bold;
    }

    .cta {
      padding: 4rem 0;
      text-align: center;
      background: linear-gradient(135deg, var(--bg-1) 0%, var(--bg-2) 100%);
    }

    .cta h2 {
      font-size: 2rem;
      font-weight: 700;
      margin: 0 0 1rem 0;
    }

    .cta p {
      font-size: 1.1rem;
      color: var(--text-secondary);
      margin: 0 0 2rem 0;
    }

    .btn-primary {
      display: inline-block;
      padding: 0.875rem 2rem;
      background: var(--teal);
      color: var(--bg-0);
      text-decoration: none;
      border-radius: var(--radius);
      font-weight: 600;
      transition: all 0.2s ease;
    }

    .btn-primary:hover {
      background: #13c4bc;
      transform: translateY(-2px);
      box-shadow: 0 10px 30px rgba(20, 212, 201, 0.3);
    }

    @media (max-width: 768px) {
      .use-case-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class UseCasesPageComponent implements OnInit {
  constructor(
    private title: Title,
    private meta: Meta
  ) {}

  ngOnInit(): void {
    this.title.setTitle('Use Cases - TruWit');
    this.meta.updateTag({ name: 'description', content: 'Discover how TruWit protects content authenticity across industries, from creators to enterprises.' });
  }
}

