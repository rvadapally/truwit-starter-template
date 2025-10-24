import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-audit-page',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['./audit-page.component.scss'],
  template: `
    <div class="page">
      <section class="hero">
        <div class="container">
          <h1>TruViz Audit</h1>
          <p class="subtitle">Comprehensive audit trails for verified content</p>
        </div>
      </section>
      <section class="content">
        <div class="container">
          <p>Complete audit history and verification trails for your content.</p>
        </div>
      </section>
    </div>
  `
})
export class AuditPageComponent implements OnInit {
  constructor(private title: Title, private meta: Meta) {}
  ngOnInit(): void {
    this.title.setTitle('TruViz Audit - TruWit');
    this.meta.updateTag({ name: 'description', content: 'Comprehensive audit trails with TruViz Audit' });
  }
}

