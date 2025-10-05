import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AccessibilityService {
  private isHighContrast = false;
  private fontSize = 16; // Base font size in pixels

  constructor() {
    this.loadAccessibilitySettings();
    this.detectSystemPreferences();
  }

  // High contrast mode
  toggleHighContrast(): void {
    this.isHighContrast = !this.isHighContrast;
    this.applyHighContrast();
    this.saveAccessibilitySettings();
  }

  isHighContrastMode(): boolean {
    return this.isHighContrast;
  }

  private applyHighContrast(): void {
    const root = document.documentElement;
    if (this.isHighContrast) {
      root.classList.add('high-contrast');
      root.style.setProperty('--primary-color', '#ffffff');
      root.style.setProperty('--secondary-color', '#ffff00');
      root.style.setProperty('--background-color', '#000000');
      root.style.setProperty('--text-color', '#ffffff');
    } else {
      root.classList.remove('high-contrast');
      // Reset to theme colors
      const themeService = (window as any).themeService;
      if (themeService) {
        themeService.applyTheme(themeService.getCurrentTheme());
      }
    }
  }

  // Font size controls
  increaseFontSize(): void {
    this.fontSize = Math.min(this.fontSize + 2, 24);
    this.applyFontSize();
    this.saveAccessibilitySettings();
  }

  decreaseFontSize(): void {
    this.fontSize = Math.max(this.fontSize - 2, 12);
    this.applyFontSize();
    this.saveAccessibilitySettings();
  }

  resetFontSize(): void {
    this.fontSize = 16;
    this.applyFontSize();
    this.saveAccessibilitySettings();
  }

  getFontSize(): number {
    return this.fontSize;
  }

  private applyFontSize(): void {
    document.documentElement.style.fontSize = `${this.fontSize}px`;
  }

  // Focus management
  focusElement(elementId: string): void {
    const element = document.getElementById(elementId);
    if (element) {
      element.focus();
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  announceToScreenReader(message: string): void {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  // Keyboard navigation
  handleKeyboardNavigation(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Tab':
        // Ensure focus is visible
        document.body.classList.add('keyboard-navigation');
        break;
      case 'Escape':
        // Close modals or return focus
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement && activeElement.blur) {
          activeElement.blur();
        }
        break;
    }
  }

  // Detect system preferences
  private detectSystemPreferences(): void {
    // Check for prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      document.documentElement.classList.add('reduced-motion');
    }

    // Check for prefers-color-scheme
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark && !localStorage.getItem('truwit-theme')) {
      // Auto-apply dark theme if user prefers it
      const themeService = (window as any).themeService;
      if (themeService) {
        themeService.setTheme('dark');
      }
    }
  }

  // Save/load settings
  private saveAccessibilitySettings(): void {
    localStorage.setItem('truwit-accessibility', JSON.stringify({
      highContrast: this.isHighContrast,
      fontSize: this.fontSize
    }));
  }

  private loadAccessibilitySettings(): void {
    const settings = localStorage.getItem('truwit-accessibility');
    if (settings) {
      try {
        const parsed = JSON.parse(settings);
        this.isHighContrast = parsed.highContrast || false;
        this.fontSize = parsed.fontSize || 16;
        this.applyHighContrast();
        this.applyFontSize();
      } catch (error) {
        console.warn('Failed to load accessibility settings:', error);
      }
    }
  }

  // Initialize accessibility features
  initialize(): void {
    // Add keyboard navigation listener
    document.addEventListener('keydown', (event) => this.handleKeyboardNavigation(event));
    
    // Add focus management
    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-navigation');
    });

    // Announce page load
    setTimeout(() => {
      this.announceToScreenReader('Page loaded successfully');
    }, 1000);
  }
}
