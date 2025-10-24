import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-verify-landing-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  styleUrls: ['./verify-landing-page.component.scss'],
  template: `
    <div class="verify-landing">
      <section class="hero">
        <div class="container">
          <h1>Verify Content Authenticity</h1>
          <p class="hero-subtitle">
            Upload any image or video to instantly verify its authenticity with our
            advanced AI-powered verification system
          </p>
          <button (click)="openVerifier()" class="btn-primary">
            Open Verification Tool
          </button>
        </div>
      </section>

      <section class="features">
        <div class="container">
          <h2>Why Verify with TruWit?</h2>
          <div class="features-grid">
            <div class="feature">
              <h3>🔒 Cryptographic Proof</h3>
              <p>C2PA-compliant verification with digital signatures</p>
            </div>
            <div class="feature">
              <h3>🤖 AI Detection</h3>
              <p>Detect synthetic and manipulated content</p>
            </div>
            <div class="feature">
              <h3>⚡ Instant Results</h3>
              <p>Get verification results in seconds</p>
            </div>
            <div class="feature">
              <h3>📊 Detailed Reports</h3>
              <p>Comprehensive analysis with metadata</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  `
})
export class VerifyLandingPageComponent implements OnInit {
  constructor(
    private title: Title,
    private meta: Meta,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.title.setTitle('Verify Content - TruWit');
    this.meta.updateTag({
      name: 'description',
      content: 'Verify the authenticity of digital content with TruWit\'s advanced verification tools.'
    });
  }

  openVerifier(): void {
    this.router.navigate(['/verify/tool']);
  }
}
