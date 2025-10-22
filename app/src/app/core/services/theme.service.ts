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
  // Locked to dark theme only
  private readonly darkTheme: Theme = {
    name: 'dark',
    displayName: 'Dark',
    primaryColor: '#0ea5e9',
    secondaryColor: '#22c55e',
    backgroundColor: '#0a1428',
    textColor: '#e6eefc',
    accentColor: '#8b5cf6'
  };

  private currentThemeSubject = new BehaviorSubject<Theme>(this.darkTheme);
  public currentTheme$ = this.currentThemeSubject.asObservable();

  constructor() {
    this.applyTheme(this.darkTheme);
  }

  getThemes(): Theme[] {
    return [this.darkTheme];
  }

  getCurrentTheme(): Theme {
    return this.darkTheme;
  }

  // Theme switching is disabled - always returns dark theme
  setTheme(themeName: string): void {
    this.applyTheme(this.darkTheme);
  }

  private applyTheme(theme: Theme): void {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', theme.primaryColor);
    root.style.setProperty('--secondary-color', theme.secondaryColor);
    root.style.setProperty('--background-color', theme.backgroundColor);
    root.style.setProperty('--text-color', theme.textColor);
    root.style.setProperty('--accent-color', theme.accentColor);
    
    // Force dark theme attribute
    document.documentElement.setAttribute('data-theme', 'dark');
    
    // Update meta theme-color
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute('content', theme.primaryColor);
  }
}
