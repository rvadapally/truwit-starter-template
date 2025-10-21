import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'theme';
  private readonly DEFAULT_THEME = 'dark'; // Default to dark theme
  
  private themeSubject = new BehaviorSubject<string>(this.getStoredTheme());
  public theme$ = this.themeSubject.asObservable();

  constructor() {
    // Initialize theme on service creation
    this.setTheme(this.getStoredTheme());
  }

  getCurrentTheme(): string {
    return this.themeSubject.value;
  }

  setTheme(theme: 'light' | 'dark'): void {
    // Update localStorage
    localStorage.setItem(this.THEME_KEY, theme);
    
    // Update document attribute
    document.documentElement.setAttribute('data-theme', theme);
    
    // Update subject
    this.themeSubject.next(theme);
  }

  toggleTheme(): void {
    const currentTheme = this.getCurrentTheme();
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  private getStoredTheme(): string {
    const stored = localStorage.getItem(this.THEME_KEY);
    return stored || this.DEFAULT_THEME;
  }

  // Listen for theme changes from external sources (like Astro)
  initializeFromStorage(): void {
    const storedTheme = this.getStoredTheme();
    if (storedTheme !== this.getCurrentTheme()) {
      this.setTheme(storedTheme as 'light' | 'dark');
    }
  }
}