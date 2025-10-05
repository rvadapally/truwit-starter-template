import { Component, OnInit } from '@angular/core';
import { ThemeService, Theme } from '../../core/services/theme.service';
import { AccessibilityService } from '../../core/services/accessibility.service';

@Component({
  selector: 'app-accessibility-toolbar',
  template: `
    <div class="accessibility-toolbar" role="toolbar" aria-label="Accessibility controls">
      <!-- Theme Selector -->
      <div class="toolbar-group" role="group" aria-label="Theme selection">
        <label for="theme-select" class="sr-only">Select theme</label>
        <select 
          id="theme-select" 
          class="toolbar-control"
          [value]="currentTheme.name"
          (change)="onThemeChange($event)"
          aria-label="Theme selection">
          <option *ngFor="let theme of themes" [value]="theme.name">
            {{ theme.displayName }}
          </option>
        </select>
      </div>

      <!-- Font Size Controls -->
      <div class="toolbar-group" role="group" aria-label="Font size controls">
        <button 
          class="toolbar-button"
          (click)="decreaseFontSize()"
          aria-label="Decrease font size"
          title="Decrease font size">
          A-
        </button>
        <span class="font-size-display">{{ fontSize }}px</span>
        <button 
          class="toolbar-button"
          (click)="increaseFontSize()"
          aria-label="Increase font size"
          title="Increase font size">
          A+
        </button>
        <button 
          class="toolbar-button"
          (click)="resetFontSize()"
          aria-label="Reset font size"
          title="Reset font size">
          A
        </button>
      </div>

      <!-- High Contrast Toggle -->
      <div class="toolbar-group" role="group" aria-label="High contrast toggle">
        <button 
          class="toolbar-button"
          [class.active]="isHighContrast"
          (click)="toggleHighContrast()"
          aria-label="Toggle high contrast mode"
          title="Toggle high contrast mode">
          <span aria-hidden="true">⚫</span>
          <span class="sr-only">High contrast {{ isHighContrast ? 'on' : 'off' }}</span>
        </button>
      </div>

      <!-- Skip to main content -->
      <div class="toolbar-group">
        <button 
          class="toolbar-button skip-link"
          (click)="skipToMain()"
          aria-label="Skip to main content">
          Skip to main content
        </button>
      </div>
    </div>
  `,
  styles: [`
    .accessibility-toolbar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: var(--background-color);
      border-bottom: 1px solid var(--primary-color);
      padding: 0.5rem;
      display: flex;
      gap: 1rem;
      align-items: center;
      z-index: 1000;
      flex-wrap: wrap;
    }

    .toolbar-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .toolbar-control {
      padding: 0.25rem 0.5rem;
      border: 1px solid var(--primary-color);
      background: var(--background-color);
      color: var(--text-color);
      border-radius: 4px;
      font-size: 0.875rem;
    }

    .toolbar-button {
      padding: 0.25rem 0.5rem;
      border: 1px solid var(--primary-color);
      background: var(--background-color);
      color: var(--text-color);
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.875rem;
      transition: all 0.2s;
    }

    .toolbar-button:hover {
      background: var(--primary-color);
      color: var(--background-color);
    }

    .toolbar-button.active {
      background: var(--primary-color);
      color: var(--background-color);
    }

    .font-size-display {
      font-size: 0.75rem;
      color: var(--text-color);
      opacity: 0.7;
      min-width: 3rem;
      text-align: center;
    }

    .skip-link {
      background: var(--accent-color);
      color: white;
      font-weight: bold;
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    @media (max-width: 768px) {
      .accessibility-toolbar {
        flex-direction: column;
        align-items: stretch;
      }
      
      .toolbar-group {
        justify-content: center;
      }
    }
  `]
})
export class AccessibilityToolbarComponent implements OnInit {
  themes: Theme[] = [];
  currentTheme: Theme;
  fontSize: number;
  isHighContrast: boolean;

  constructor(
    private themeService: ThemeService,
    private accessibilityService: AccessibilityService
  ) {
    this.currentTheme = this.themeService.getCurrentTheme();
    this.fontSize = this.accessibilityService.getFontSize();
    this.isHighContrast = this.accessibilityService.isHighContrastMode();
  }

  ngOnInit(): void {
    this.themes = this.themeService.getThemes();
    
    this.themeService.currentTheme$.subscribe(theme => {
      this.currentTheme = theme;
    });
  }

  onThemeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.themeService.setTheme(target.value);
  }

  increaseFontSize(): void {
    this.accessibilityService.increaseFontSize();
    this.fontSize = this.accessibilityService.getFontSize();
  }

  decreaseFontSize(): void {
    this.accessibilityService.decreaseFontSize();
    this.fontSize = this.accessibilityService.getFontSize();
  }

  resetFontSize(): void {
    this.accessibilityService.resetFontSize();
    this.fontSize = this.accessibilityService.getFontSize();
  }

  toggleHighContrast(): void {
    this.accessibilityService.toggleHighContrast();
    this.isHighContrast = this.accessibilityService.isHighContrastMode();
  }

  skipToMain(): void {
    this.accessibilityService.focusElement('main-content');
  }
}
