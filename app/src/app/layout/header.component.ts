import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  styleUrls: ['./header.component.scss'],
  template: `
    <header class="header">
      <nav class="nav">
        <div class="nav-brand">
          <a routerLink="/" class="logo-link">
            <img src="/assets/logo.svg" alt="TruWit Logo" class="nav-logo">
            <span class="brand-name">TruWit</span>
          </a>
        </div>
        
        <div class="nav-menu">
          <a routerLink="/" class="nav-link">Home</a>
          <a routerLink="/how-it-works" class="nav-link">How It Works</a>
          <a routerLink="/use-cases" class="nav-link">Use Cases</a>
          <a routerLink="/technology" class="nav-link">Technology</a>
          <a routerLink="/pricing" class="nav-link">Pricing</a>
          <a routerLink="/products" class="nav-link">Products</a>
          <a routerLink="/verify/tool" class="btn-launch">Launch App</a>
        </div>
      </nav>
    </header>
  `
})
export class HeaderComponent {
}

