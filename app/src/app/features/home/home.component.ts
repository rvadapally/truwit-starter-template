import { Component, type OnInit } from '@angular/core';

@Component({
  selector: 'app-home',
  template: `
    <div class="landing-content">
      <p class="subtitle gradient-text">Where Provenance Meets Proof</p>
      
      <div class="landing-card">
        <h2 class="card-title">
          <span class="gradient-text-primary">Verify origin. Prove consent.</span>
          <span class="gradient-text-secondary">Publish with confidence.</span>
        </h2>
        <p class="card-description">
          Truwit attaches cryptographic provenance, consent, and authenticity to digital media. 
          Verify the origin and prove consent for AI-generated content.
        </p>
        
        <div class="features">
          <div class="feature">
            <div class="feature-icon">🔒</div>
            <h3>Cryptographic Proof</h3>
            <p>Immutable verification using blockchain technology</p>
          </div>
          <div class="feature">
            <div class="feature-icon">✅</div>
            <h3>Consent Tracking</h3>
            <p>Track and verify consent for likeness usage</p>
          </div>
          <div class="feature">
            <div class="feature-icon">🎯</div>
            <h3>AI Detection</h3>
            <p>Identify and verify AI-generated content</p>
          </div>
        </div>
        
        <div class="cta-section">
          <button class="cta-button" routerLink="/verify">
            Start Verification
          </button>
          <p class="cta-subtitle">Upload your content to begin</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .landing-content {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .subtitle {
      font-size: 1.5rem;
      text-align: center;
      margin-bottom: 2rem;
      background: linear-gradient(135deg, #0ea5e9, #22c55e);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .landing-card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 3rem;
      text-align: center;
    }
    
    .card-title {
      font-size: 2.5rem;
      margin-bottom: 1rem;
      line-height: 1.2;
    }
    
    .gradient-text-primary {
      color: #0ea5e9;
    }
    
    .gradient-text-secondary {
      color: #22c55e;
    }
    
    .card-description {
      font-size: 1.1rem;
      color: #9fb3d9;
      margin-bottom: 3rem;
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;
    }
    
    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
      margin-bottom: 3rem;
    }
    
    .feature {
      text-align: center;
    }
    
    .feature-icon {
      font-size: 2rem;
      margin-bottom: 1rem;
    }
    
    .feature h3 {
      color: #0ea5e9;
      margin-bottom: 0.5rem;
    }
    
    .feature p {
      color: #9fb3d9;
      font-size: 0.9rem;
    }
    
    .cta-section {
      text-align: center;
    }
    
    .cta-button {
      background: linear-gradient(135deg, #0ea5e9, #22c55e);
      color: white;
      border: none;
      padding: 1rem 2rem;
      border-radius: 12px;
      font-size: 1.1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      text-decoration: none;
      display: inline-block;
    }
    
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
    }
    
    .cta-subtitle {
      color: #9fb3d9;
      margin-top: 1rem;
      font-size: 0.9rem;
    }
  `]
})
export class HomeComponent implements OnInit {
  ngOnInit(): void {
    // Component initialized
  }
}
