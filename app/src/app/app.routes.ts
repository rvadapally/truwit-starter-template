import type { Routes } from '@angular/router';
import { PublicVerifyComponent } from './features/verification/components/public-verify.component';
import { VerifyPageComponent } from './features/verification/components/verify-page.component';

// Marketing pages
import { HomePageComponent } from './pages/home-page.component';
import { ProductsPageComponent } from './pages/products-page.component';
import { TruVizPageComponent } from './pages/truviz-page.component';
import { AuditPageComponent } from './pages/audit-page.component';
import { PricingPageComponent } from './pages/pricing-page.component';
import { VerifyLandingPageComponent } from './pages/verify-landing-page.component';
import { PrivacyPageComponent } from './pages/privacy-page.component';
import { TermsPageComponent } from './pages/terms-page.component';

export const routes: Routes = [
  // Marketing routes (prerendered)
  { path: '', component: HomePageComponent },
  { path: 'products', component: ProductsPageComponent },
  { path: 'truviz', component: TruVizPageComponent },
  { path: 'audit', component: AuditPageComponent },
  { path: 'pricing', component: PricingPageComponent },
  { path: 'verify', component: VerifyLandingPageComponent },
  { path: 'legal/privacy', component: PrivacyPageComponent },
  { path: 'legal/terms', component: TermsPageComponent },
  
  // App routes (dynamic)
  { path: 'verify/tool', component: VerifyPageComponent },
  { path: 't/:id', component: PublicVerifyComponent },
  
  // Legacy redirects
  { path: 'app/verify', redirectTo: '/verify/tool', pathMatch: 'full' },
  { path: 'app/t/:id', redirectTo: '/t/:id', pathMatch: 'full' },
  { path: 'app', redirectTo: '/', pathMatch: 'full' },
  
  // Catch-all
  { path: '**', redirectTo: '/' }
];
