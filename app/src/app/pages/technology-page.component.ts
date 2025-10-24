import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-technology-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="technology-page">
      <section class="hero">
        <div class="container">
          <p class="section-label">TECHNOLOGY</p>
          <h1>Built on Industry Standards</h1>
          <p class="hero-subtitle">TruWit leverages cutting-edge cryptographic standards and AI detection to ensure content authenticity</p>
        </div>
      </section>

      <section class="tech-stack">
        <div class="container">
          <div class="tech-grid">
            <div class="tech-card">
              <div class="tech-icon">🔐</div>
              <h3>C2PA Compliance</h3>
              <p>Coalition for Content Provenance and Authenticity (C2PA) standard for tamper-evident content credentials.</p>
            </div>

            <div class="tech-card">
              <div class="tech-icon">🔑</div>
              <h3>Cryptographic Signatures</h3>
              <p>Military-grade cryptographic fingerprints that uniquely identify and protect your content.</p>
            </div>

            <div class="tech-card">
              <div class="tech-icon">🤖</div>
              <h3>AI Detection</h3>
              <p>Advanced algorithms to detect AI-generated and synthetically manipulated media.</p>
            </div>

            <div class="tech-card">
              <div class="tech-icon">⚡</div>
              <h3>Edge Computing</h3>
              <p>Local hashing ensures your files never leave your device—privacy by design.</p>
            </div>

            <div class="tech-card">
              <div class="tech-icon">🌐</div>
              <h3>Decentralized Verification</h3>
              <p>Anyone can independently verify proofs without relying on centralized authorities.</p>
            </div>

            <div class="tech-card">
              <div class="tech-icon">📊</div>
              <h3>Perceptual Hashing</h3>
              <p>Robust content fingerprinting that survives compression and format changes.</p>
            </div>
          </div>
        </div>
      </section>

      <section class="how-it-works-tech">
        <div class="container">
          <h2>The TruWit Process</h2>
          
          <div class="process-steps">
            <div class="process-step">
              <div class="step-number">1</div>
              <div class="step-content">
                <h3>Content Analysis</h3>
                <p>We extract key attributes: perceptual hash, metadata, creation timestamp, and creator identity.</p>
              </div>
            </div>

            <div class="process-step">
              <div class="step-number">2</div>
              <div class="step-content">
                <h3>Cryptographic Binding</h3>
                <p>A unique cryptographic signature is created and bound to the content's DNA.</p>
              </div>
            </div>

            <div class="process-step">
              <div class="step-number">3</div>
              <div class="step-content">
                <h3>Proof Generation</h3>
                <p>An immutable proof record is generated with C2PA-compliant credentials.</p>
              </div>
            </div>

            <div class="process-step">
              <div class="step-number">4</div>
              <div class="step-content">
                <h3>Badge Creation</h3>
                <p>A verifiable badge is created that anyone can use to check authenticity.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="cta">
        <div class="container">
          <h2>Experience the Technology</h2>
          <p>Try TruWit's verification platform and see how cryptographic proof works</p>
          <a routerLink="/verify/tool" class="btn-primary">Start Verification</a>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .technology-page {
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

    .tech-stack {
      padding: 3rem 0;
    }

    .tech-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 2rem;
      margin-top: 2rem;
    }

    .tech-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: var(--radius);
      padding: 2rem;
      transition: all 0.3s ease;
    }

    .tech-card:hover {
      transform: translateY(-4px);
      border-color: rgba(14, 165, 233, 0.3);
      box-shadow: 0 10px 30px rgba(14, 165, 233, 0.1);
    }

    .tech-icon {
      font-size: 2.5rem;
      margin-bottom: 1rem;
    }

    .tech-card h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 1rem 0;
    }

    .tech-card p {
      color: var(--text-secondary);
      line-height: 1.6;
      margin: 0;
    }

    .how-it-works-tech {
      padding: 4rem 0;
      background: rgba(255, 255, 255, 0.02);
    }

    .how-it-works-tech h2 {
      text-align: center;
      font-size: 2rem;
      font-weight: 700;
      margin: 0 0 3rem 0;
    }

    .process-steps {
      max-width: 800px;
      margin: 0 auto;
    }

    .process-step {
      display: flex;
      gap: 2rem;
      margin-bottom: 2.5rem;
      align-items: flex-start;
    }

    .step-number {
      flex-shrink: 0;
      width: 3rem;
      height: 3rem;
      border-radius: 50%;
      background: var(--teal);
      color: var(--bg-0);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      font-weight: 700;
    }

    .step-content h3 {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
    }

    .step-content p {
      color: var(--text-secondary);
      line-height: 1.6;
      margin: 0;
    }

    .cta {
      padding: 4rem 0;
      text-align: center;
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
      .tech-grid {
        grid-template-columns: 1fr;
      }

      .process-step {
        flex-direction: column;
        gap: 1rem;
      }
    }
  `]
})
export class TechnologyPageComponent implements OnInit {
  constructor(
    private title: Title,
    private meta: Meta
  ) {}

  ngOnInit(): void {
    this.title.setTitle('Technology - TruWit');
    this.meta.updateTag({ name: 'description', content: 'Learn about the cryptographic standards and AI technology that power TruWit\'s content verification.' });
  }
}

