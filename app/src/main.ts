
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

// Initialize theme before Angular bootstrap
const initializeTheme = () => {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
};

// Set theme immediately
initializeTheme();

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
