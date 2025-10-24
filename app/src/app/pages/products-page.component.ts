import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-products-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page">
      <section class="hero">
        <div class="container">
          <h1>TruWit Products</h1>
          <p class="subtitle">Choose the right solution for your content verification needs</p>
        </div>
      </section>
      <section class="content">
        <div class="container">
          <div class="products-grid">
            <div class="product-card">
              <h2>TruViz</h2>
              <p>Visual content verification with real-time analysis</p>
              <a routerLink="/truviz" class="btn">Learn More</a>
            </div>
            <div class="product-card">
              <h2>TruViz Audit</h2>
              <p>Comprehensive audit trails for verified content</p>
              <a routerLink="/audit" class="btn">Learn More</a>
            </div>
          </div>
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
    .products-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; }
    .product-card { padding: 2rem; background: var(--bg-1); border: 1px solid var(--border); border-radius: var(--radius); text-align: center; }
    .product-card h2 { color: var(--text-primary); margin: 0 0 1rem; }
    .product-card p { color: var(--text-secondary); margin: 0 0 1.5rem; }
    .btn { display: inline-block; padding: 0.75rem 1.5rem; background: var(--teal); color: #0B1116; border-radius: var(--radius); text-decoration: none; font-weight: 600; }
  `]
})
export class ProductsPageComponent implements OnInit {
  constructor(private title: Title, private meta: Meta) {}
  ngOnInit(): void {
    this.title.setTitle('Products - TruWit');
    this.meta.updateTag({ name: 'description', content: 'Explore TruWit content verification products' });
  }
}

