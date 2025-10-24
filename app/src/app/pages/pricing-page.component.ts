import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-pricing-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <section class="hero">
        <div class="container">
          <h1>Pricing</h1>
          <p class="subtitle">Choose the plan that fits your needs</p>
        </div>
      </section>
      <section class="content">
        <div class="container">
          <p>Simple, transparent pricing for content verification.</p>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .page { min-height: 100vh; background: var(--bg-0); color: var(--text-primary); }
    .hero { padding: 3rem 0; text-align: center; background: var(--bg-1); }
    .container { max-width: var(--w-container); margin: 0 auto; padding: 0 1.5rem; }
    .hero h1 { font-size: 2.5rem; margin: 0 0 1rem; background: linear-gradient(135deg, var(--teal), #2de2b5); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .subtitle { font-size: 1.125rem; color: var(--text-secondary); margin: 0; }
    .content { padding: 4rem 0; }
    .content p { color: var(--text-secondary); line-height: 1.6; }
  `]
})
export class PricingPageComponent implements OnInit {
  constructor(private title: Title, private meta: Meta) {}
  ngOnInit(): void {
    this.title.setTitle('Pricing - TruWit');
    this.meta.updateTag({ name: 'description', content: 'TruWit pricing plans' });
  }
}

