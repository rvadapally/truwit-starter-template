import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Theme {
  name: string;
  displayName: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
}

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly themes: Theme[] = [
    {
      name: 'default',
      displayName: 'Default',
      primaryColor: '#0ea5e9',
      secondaryColor: '#22c55e',
      backgroundColor: '#0f172a',
      textColor: '#e6eefc',
      accentColor: '#8b5cf6'
    },
    {
      name: 'dark',
      displayName: 'Dark',
      primaryColor: '#1e40af',
      secondaryColor: '#059669',
      backgroundColor: '#111827',
      textColor: '#f9fafb',
      accentColor: '#7c3aed'
    },
    {
      name: 'light',
      displayName: 'Light',
      primaryColor: '#2563eb',
      secondaryColor: '#16a34a',
      backgroundColor: '#ffffff',
      textColor: '#1f2937',
      accentColor: '#9333ea'
    }
  ];

  private currentThemeSubject = new BehaviorSubject<Theme>(this.themes[0]);
  public currentTheme$ = this.currentThemeSubject.asObservable();

  constructor() {
    this.loadThemeFromStorage();
  }

  getThemes(): Theme[] {
    return [...this.themes];
  }

  getCurrentTheme(): Theme {
    return this.currentThemeSubject.value;
  }

  setTheme(themeName: string): void {
    const theme = this.themes.find(t => t.name === themeName);
    if (theme) {
      this.currentThemeSubject.next(theme);
      this.applyTheme(theme);
      this.saveThemeToStorage(themeName);
    }
  }

  private applyTheme(theme: Theme): void {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', theme.primaryColor);
    root.style.setProperty('--secondary-color', theme.secondaryColor);
    root.style.setProperty('--background-color', theme.backgroundColor);
    root.style.setProperty('--text-color', theme.textColor);
    root.style.setProperty('--accent-color', theme.accentColor);
    
    // Update meta theme-color
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute('content', theme.primaryColor);
  }

  private loadThemeFromStorage(): void {
    const savedTheme = localStorage.getItem('truwit-theme');
    if (savedTheme) {
      this.setTheme(savedTheme);
    } else {
      this.applyTheme(this.themes[0]);
    }
  }

  private saveThemeToStorage(themeName: string): void {
    localStorage.setItem('truwit-theme', themeName);
  }
}
