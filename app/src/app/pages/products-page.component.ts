import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-products-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  styleUrls: ['./products-page.component.scss'],
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
            <div class="product-card highlight">
              <h2>TruWit OpenClaw MCP</h2>
              <p>Continuous compliance evidence + security questionnaire autopilot</p>
              <a routerLink="/openclaw-mcp" class="btn">Learn More</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  `
})
export class ProductsPageComponent implements OnInit {
  constructor(private title: Title, private meta: Meta) {}
  ngOnInit(): void {
    this.title.setTitle('Products - TruWit');
    this.meta.updateTag({ name: 'description', content: 'Explore TruWit content verification products' });
  }
}

