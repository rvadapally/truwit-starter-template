import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Title, Meta } from '@angular/platform-browser';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HttpClientModule],
  styleUrls: ['./home-page.component.scss'],
  template: `
    <div class="home-page">
      <section class="hero">
        <div class="container">
          <div class="hero-content">
            <h1>Your Art. Your Proof.<br><span class="highlight">Anchored to Bitcoin.</span></h1>
            <p class="hero-subtitle">
              Prove you created it first. TruWit timestamps your content on the Bitcoin blockchain—creating 
              cryptographic proof that can't be faked, edited, or deleted. Free forever.
            </p>
            <div class="hero-actions">
              <a routerLink="/verify" class="btn-primary">Create Your Proof</a>
              <a routerLink="/how-it-works" class="btn-secondary">See How It Works</a>
              <a routerLink="/openclaw-mcp" class="btn-secondary">Compliance Autopilot (New)</a>
            </div>
            <div class="hero-trust">
              <span class="trust-badge">⚡ Bitcoin Anchored</span>
              <span class="trust-badge">🔒 C2PA Compatible</span>
              <span class="trust-badge">💰 Free Forever</span>
            </div>
          </div>
          <div class="hero-visual">
            <div class="proof-card-preview">
              <img src="/assets/proof-card-preview.png" alt="TruWit Proof Card" />
            </div>
          </div>
        </div>
      </section>

      <section class="problem">
        <div class="container">
          <h2>AI is scraping your art.<br>When you fight back, you'll need proof.</h2>
          <p class="problem-subtitle">
            Screenshots can be faked. Metadata can be edited. But a Bitcoin timestamp? That's forever.
          </p>
        </div>
      </section>

      <section class="features">
        <div class="container">
          <h2>How TruWit Works</h2>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">📤</div>
              <h3>1. Upload Your Work</h3>
              <p>Paste a URL or upload an image, video, or document. Takes 10 seconds.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🔐</div>
              <h3>2. We Hash & Timestamp</h3>
              <p>Your content is cryptographically hashed and submitted to the Bitcoin blockchain.</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🎫</div>
              <h3>3. Get Your Proof</h3>
              <p>Receive a shareable proof card and downloadable .ots file anyone can verify.</p>
            </div>
          </div>
        </div>
      </section>

      <section class="bitcoin-section">
        <div class="container">
          <div class="bitcoin-badge">⚡</div>
          <h2>Why Bitcoin?</h2>
          <p class="bitcoin-text">
            No one can edit the Bitcoin blockchain. No company can delete it. No government can censor it.
            Your proof exists as long as Bitcoin exists—and it's <strong>completely free</strong> thanks to 
            OpenTimestamps batching.
          </p>
        </div>
      </section>

      <section class="use-cases">
        <div class="container">
          <h2>Who Uses TruWit</h2>
          <div class="use-cases-grid">
            <div class="use-case-card">
              <h3>🎨 Artists</h3>
              <p>Prove you created artwork before it gets AI-scraped or stolen.</p>
            </div>
            <div class="use-case-card">
              <h3>📷 Photographers</h3>
              <p>Timestamp photos before publishing to prove original ownership.</p>
            </div>
            <div class="use-case-card">
              <h3>📰 Journalists</h3>
              <p>Create evidence chains for sensitive source material.</p>
            </div>
            <div class="use-case-card">
              <h3>⚖️ Legal</h3>
              <p>Establish prior art and creation dates for IP disputes.</p>
            </div>
          </div>
        </div>
      </section>

      <section class="cta-final">
        <h2>Prove you made it. Before they steal it.</h2>
        <div class="cta-actions">
          <a routerLink="/verify/tool" class="btn-primary btn-large">Create Your First Proof</a>
        </div>
        <p class="privacy-note">Free forever. No crypto wallet needed. Your files are never stored.</p>
      </section>

      <section class="email-capture">
        <div class="container">
          <h2>Stay Updated</h2>
          <p>Get notified about new features and updates.</p>
          <form (submit)="onEmailSubmit($event)" class="email-form" *ngIf="!emailSubmitted">
            <input 
              type="email" 
              [(ngModel)]="email" 
              name="email"
              placeholder="Enter your email" 
              required
              [disabled]="isSubmitting"
            />
            <button type="submit" class="btn-primary" [disabled]="isSubmitting">
              {{ isSubmitting ? 'Subscribing...' : 'Subscribe' }}
            </button>
          </form>
          <div class="email-success" *ngIf="emailSubmitted">
            <span class="success-icon">✓</span>
            <p>{{ successMessage }}</p>
          </div>
          <p class="email-error" *ngIf="errorMessage">{{ errorMessage }}</p>
          <p class="email-note" *ngIf="!emailSubmitted">No spam, ever. Unsubscribe anytime.</p>
        </div>
      </section>
    </div>
  `
})
export class HomePageComponent implements OnInit {
  private http = inject(HttpClient);
  
  email = '';
  emailSubmitted = false;
  isSubmitting = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private title: Title,
    private meta: Meta
  ) {}

  ngOnInit(): void {
    this.title.setTitle('TruWit - Bitcoin-Anchored Proof of Creation | Free Content Timestamp');
    this.meta.updateTag({
      name: 'description',
      content: 'Prove you created it first. TruWit timestamps your art, photos, and videos on the Bitcoin blockchain. Free, no crypto wallet needed.'
    });
    this.meta.updateTag({
      name: 'keywords',
      content: 'content provenance, bitcoin timestamp, proof of creation, ai art protection, opentimestamps, c2pa, digital watermark'
    });
  }

  onEmailSubmit(event: Event): void {
    event.preventDefault();
    if (!this.email || this.isSubmitting) return;
    
    this.isSubmitting = true;
    this.errorMessage = '';
    
    this.http.post<{ message: string; success?: boolean; alreadySubscribed?: boolean; resubscribed?: boolean }>(
      `${environment.apiUrl}/v1/subscribe`,
      { email: this.email, source: 'homepage' }
    ).subscribe({
      next: (response) => {
        this.emailSubmitted = true;
        this.successMessage = response.message;
        this.email = '';
        this.isSubmitting = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.error || 'Something went wrong. Please try again.';
        this.isSubmitting = false;
      }
    });
  }
}

