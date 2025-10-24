import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-use-cases-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  styleUrls: ['./use-cases-page.component.scss'],
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
          <a routerLink="/verify" class="btn-primary">Get Started</a>
        </div>
      </section>
    </div>
  `
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
