import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-technology-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  styleUrls: ['./technology-page.component.scss'],
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
  `
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
