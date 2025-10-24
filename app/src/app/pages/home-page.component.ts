import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  styleUrls: ['./home-page.component.scss'],
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
              <a routerLink="/verify" class="btn-primary">Start Verification</a>
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
        <h2>Verify origin. Prove consent. Publish with confidence.</h2>
        <div class="cta-actions">
          <a routerLink="/verify/tool" class="btn-primary">Start Verification</a>
        </div>
        <p class="privacy-note">We hash locally. Your files are not stored.</p>
      </section>
    </div>
  `
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

