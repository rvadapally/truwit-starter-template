import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-audit-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <section class="hero">
        <div class="container">
          <h1>TruWit Audit</h1>
          <p class="subtitle">Comprehensive audit trails for verified content</p>
        </div>
      </section>
      <section class="content">
        <div class="container">
          <p>Complete audit history and verification trails for your content.</p>
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
    .content { padding: 4rem 0; text-align: center; }
    .content p { color: var(--text-secondary); line-height: 1.6; }
  `]
})
export class AuditPageComponent implements OnInit {
  constructor(private title: Title, private meta: Meta) {}
  ngOnInit(): void {
    this.title.setTitle('TruWit Audit - TruWit');
    this.meta.updateTag({ name: 'description', content: 'Comprehensive audit trails with TruWit Audit' });
  }
}

