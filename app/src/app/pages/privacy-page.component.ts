import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-privacy-page',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['./privacy-page.component.scss'],
  template: `
    <div class="page">
      <section class="hero">
        <div class="container">
          <h1>Privacy Policy</h1>
        </div>
      </section>
      <section class="content">
        <div class="container">
          <p>Your privacy is important to us. This policy outlines how we collect, use, and protect your information.</p>
        </div>
      </section>
    </div>
  `
})
export class PrivacyPageComponent implements OnInit {
  constructor(private title: Title, private meta: Meta) {}
  ngOnInit(): void {
    this.title.setTitle('Privacy Policy - TruWit');
    this.meta.updateTag({ name: 'description', content: 'TruWit Privacy Policy' });
  }
}

