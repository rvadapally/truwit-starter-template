import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-terms-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <section class="hero">
        <div class="container">
          <h1>Terms of Service</h1>
        </div>
      </section>
      <section class="content">
        <div class="container">
          <p>By using TruWit services, you agree to these terms and conditions.</p>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .page { min-height: 100vh; background: var(--bg-0); color: var(--text-primary); }
    .hero { padding: 2rem 0; background: var(--bg-1); }
    .container { max-width: var(--w-container); margin: 0 auto; padding: 0 1.5rem; }
    .hero h1 { font-size: 2rem; margin: 0; color: var(--text-primary); }
    .content { padding: 3rem 0; }
    .content p { color: var(--text-secondary); line-height: 1.6; }
  `]
})
export class TermsPageComponent implements OnInit {
  constructor(private title: Title, private meta: Meta) {}
  ngOnInit(): void {
    this.title.setTitle('Terms of Service - TruWit');
    this.meta.updateTag({ name: 'description', content: 'TruWit Terms of Service' });
  }
}

