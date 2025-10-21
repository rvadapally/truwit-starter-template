import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button 
      class="theme-toggle" 
      (click)="toggleTheme()" 
      [attr.aria-label]="'Switch to ' + (themeService.getCurrentTheme() === 'light' ? 'dark' : 'light') + ' theme'">
      <span class="icon-light" [class.hidden]="themeService.getCurrentTheme() === 'dark'">☀️</span>
      <span class="icon-dark" [class.hidden]="themeService.getCurrentTheme() === 'light'">🌙</span>
    </button>
  `,
  styles: [`
    .theme-toggle {
      background: none;
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-sm);
      padding: 8px 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--color-text-primary);
      font-size: 16px;
      transition: var(--transition-fast);
    }
    
    .theme-toggle:hover {
      background: var(--color-bg-secondary);
      border-color: var(--color-accent-primary);
    }
    
    .hidden {
      display: none;
    }
  `]
})
export class ThemeToggleComponent {
  constructor(public themeService: ThemeService) {}

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
