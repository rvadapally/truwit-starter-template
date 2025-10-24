import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-terms-page',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['./terms-page.component.scss'],
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
  `
})
export class TermsPageComponent implements OnInit {
  constructor(private title: Title, private meta: Meta) {}
  ngOnInit(): void {
    this.title.setTitle('Terms of Service - TruWit');
    this.meta.updateTag({ name: 'description', content: 'TruWit Terms of Service' });
  }
}

