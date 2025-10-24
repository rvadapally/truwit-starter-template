import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-verify-landing-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
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
  `,
  styles: [`
    .verify-landing {
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
      font-size: clamp(2rem, 5vw, 3rem);
      font-weight: 700;
      line-height: 1.2;
      margin: 0 0 1rem 0;
      background: linear-gradient(135deg, var(--teal), #2de2b5);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .hero-subtitle {
      font-size: 1.125rem;
      color: var(--text-secondary);
      max-width: 700px;
      margin: 0 auto 2rem;
      line-height: 1.6;
    }

    .btn-primary {
      padding: 0.875rem 2rem;
      border-radius: var(--radius);
      font-weight: 600;
      background: linear-gradient(135deg, var(--teal), var(--teal-600));
      color: #0B1116;
      border: none;
      cursor: pointer;
      font-size: 1.05rem;
      transition: all 0.2s ease;
      box-shadow: 0 4px 12px rgba(34, 224, 195, 0.25);
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(34, 224, 195, 0.35);
    }

    .features {
      padding: 4rem 0;
    }

    .features h2 {
      text-align: center;
      font-size: 2rem;
      margin: 0 0 3rem;
      color: var(--text-primary);
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
    }

    .feature {
      padding: 1.5rem;
      background: var(--bg-1);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      text-align: center;
    }

    .feature h3 {
      font-size: 1.25rem;
      color: var(--text-primary);
      margin: 0 0 0.75rem;
    }

    .feature p {
      color: var(--text-secondary);
      margin: 0;
      line-height: 1.6;
    }
  `]
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

