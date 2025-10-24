import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-how-it-works-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  styleUrls: ['./how-it-works-page.component.scss'],
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
          <a routerLink="/verify" class="btn-primary">Launch App</a>
        </div>
      </section>
    </div>
  `
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
