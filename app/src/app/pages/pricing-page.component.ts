import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-pricing-page',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['./pricing-page.component.scss'],
  template: `
    <div class="pricing-page">
      <section class="hero">
        <div class="container">
          <p class="section-label">PRICING</p>
          <h1>Simple for launch</h1>
        </div>
      </section>
      
      <section class="pricing-content">
        <div class="container">
          <div class="pricing-grid">
            <div class="pricing-card">
              <h3>Early Access — Free</h3>
              <p>Sign and verify media at no cost while we scale the network of trusted content.</p>
              <ul class="features-list">
                <li>Proof generation for creators</li>
                <li>Instant verification for anyone</li>
                <li>Downloadable manifest</li>
              </ul>
            </div>
            
            <div class="pricing-card coming-soon">
              <h3>Coming Soon</h3>
              <p class="muted">Creator Pro, Team seats, and API plans for newsrooms and platforms.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  `
})
export class PricingPageComponent implements OnInit {
  constructor(private title: Title, private meta: Meta) {}
  ngOnInit(): void {
    this.title.setTitle('Pricing — Free during Early Access - TruWit');
    this.meta.updateTag({ name: 'description', content: 'Simple pricing for launch. Free early access for creators to sign and verify media.' });
  }
}

