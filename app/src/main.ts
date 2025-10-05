
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

console.log('🚀 Angular main.ts starting...');
console.log('📍 Current URL:', window.location.href);
console.log('🌐 User Agent:', navigator.userAgent);

platformBrowserDynamic().bootstrapModule(AppModule)
  .then(() => {
    console.log('✅ Angular app bootstrapped successfully!');
    console.log('📍 Final URL:', window.location.href);
  })
  .catch(err => {
    console.error('❌ Angular bootstrap failed:', err);
  });
