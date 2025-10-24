import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-how-it-works-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="how-it-works-page">
      <section class="hero">
        <div class="container">
          <p class="section-label">PRODUCT</p>
          <h1>How it works</h1>
        </div>
      </section>

      <section class="steps">
        <div class="container">
          <div class="steps-grid">
            <div class="step-card">
              <div class="step-icon">📎</div>
              <h3>1) Add your media</h3>
              <p>Paste a public link or upload your file. Truwit accepts popular video and image formats.</p>
            </div>
            
            <div class="step-card">
              <div class="step-icon">🔒</div>
              <h3>2) Generate a proof</h3>
              <p>We create a proprietary cryptographic fingerprint bound to the key attributes that define origin.</p>
            </div>
            
            <div class="step-card">
              <div class="step-icon">✅</div>
              <h3>3) Share & verify</h3>
              <p>Publish your content with a Truwit badge. Anyone can check the proof and confirm authenticity.</p>
            </div>
          </div>
        </div>
      </section>

      <section class="for-creators">
        <div class="container">
          <div class="content-box">
            <h2>For Creators</h2>
            <p>Sign your content for free during early access. Keep control of attribution and consent while you grow.</p>
            
            <div class="features-list">
              <span class="feature-tag">No account required</span>
              <span class="feature-tag">Fast proof creation</span>
              <span class="feature-tag">Shareable badge</span>
            </div>
          </div>
        </div>
      </section>

      <section class="for-viewers">
        <div class="container">
          <div class="content-box">
            <h2>For Viewers & Teams</h2>
            <p>Verify in one click. See source, timestamp, and proof status at a glance—without exposing personal data.</p>
            
            <div class="features-list">
              <span class="feature-tag">Instant check</span>
              <span class="feature-tag">Public-safe manifest</span>
              <span class="feature-tag">Works on links & files</span>
            </div>
          </div>
        </div>
      </section>

      <section class="cta">
        <div class="container">
          <h2>Ready to try TruWit?</h2>
          <p>Sign your video or image and get a verifiable proof in seconds.</p>
          <a routerLink="/verify/tool" class="btn-primary">Launch App</a>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .how-it-works-page {
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
      margin: 0;
    }

    .steps {
      padding: 3rem 0;
    }

    .steps-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 2rem;
      margin-top: 2rem;
    }

    .step-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: var(--radius);
      padding: 2rem;
      transition: all 0.3s ease;
    }

    .step-card:hover {
      transform: translateY(-4px);
      border-color: rgba(14, 165, 233, 0.3);
      box-shadow: 0 10px 30px rgba(14, 165, 233, 0.1);
    }

    .step-icon {
      font-size: 2.5rem;
      margin-bottom: 1rem;
    }

    .step-card h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 1rem 0;
    }

    .step-card p {
      color: var(--text-secondary);
      line-height: 1.6;
      margin: 0;
    }

    .for-creators,
    .for-viewers {
      padding: 3rem 0;
    }

    .for-viewers {
      background: rgba(255, 255, 255, 0.02);
    }

    .content-box {
      max-width: 800px;
      margin: 0 auto;
      text-align: center;
    }

    .content-box h2 {
      font-size: 1.75rem;
      font-weight: 700;
      margin: 0 0 1rem 0;
      color: var(--text-primary);
    }

    .content-box p {
      font-size: 1.1rem;
      color: var(--text-secondary);
      line-height: 1.6;
      margin: 0 0 1.5rem 0;
    }

    .features-list {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      justify-content: center;
    }

    .feature-tag {
      padding: 0.5rem 1rem;
      background: rgba(14, 165, 233, 0.1);
      border: 1px solid rgba(14, 165, 233, 0.3);
      border-radius: 20px;
      font-size: 0.875rem;
      color: var(--teal);
      font-weight: 500;
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
      color: var(--text-primary);
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
      .steps-grid {
        grid-template-columns: 1fr;
      }

      .features-list {
        flex-direction: column;
        align-items: center;
      }

      .feature-tag {
        width: 100%;
        max-width: 300px;
        text-align: center;
      }
    }
  `]
})
export class HowItWorksPageComponent implements OnInit {
  constructor(
    private title: Title,
    private meta: Meta
  ) {}

  ngOnInit(): void {
    this.title.setTitle('How It Works - TruWit');
    this.meta.updateTag({ name: 'description', content: 'Learn how TruWit provides cryptographic proof of content authenticity in three simple steps.' });
  }
}

