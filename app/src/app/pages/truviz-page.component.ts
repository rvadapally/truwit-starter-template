import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-truviz-page',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['./truviz-page.component.scss'],
  template: `
    <div class="page">
      <section class="hero">
        <div class="container">
          <h1>TruViz</h1>
          <p class="subtitle">Advanced visual content verification</p>
        </div>
      </section>
      <section class="content">
        <div class="container">
          <p>Real-time analysis and C2PA compliance for visual content verification.</p>
        </div>
      </section>
    </div>
  `
})
export class TruVizPageComponent implements OnInit {
  constructor(private title: Title, private meta: Meta) {}
  ngOnInit(): void {
    this.title.setTitle('TruViz - TruWit');
    this.meta.updateTag({ name: 'description', content: 'Advanced visual content verification with TruViz' });
  }
}

