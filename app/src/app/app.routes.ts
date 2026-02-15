import type { Routes } from '@angular/router';
import { PublicVerifyComponent } from './features/verification/components/public-verify.component';
import { VerifyPageComponent } from './features/verification/components/verify-page.component';

// Marketing pages
import { HomePageComponent } from './pages/home-page.component';
import { HowItWorksPageComponent } from './pages/how-it-works-page.component';
import { UseCasesPageComponent } from './pages/use-cases-page.component';
import { TechnologyPageComponent } from './pages/technology-page.component';
import { ProductsPageComponent } from './pages/products-page.component';
import { TruVizPageComponent } from './pages/truviz-page.component';
import { AuditPageComponent } from './pages/audit-page.component';
import { PricingPageComponent } from './pages/pricing-page.component';
import { InvestorsPageComponent } from './pages/investors-page.component';
import { VerifyLandingPageComponent } from './pages/verify-landing-page.component';
import { PrivacyPageComponent } from './pages/privacy-page.component';
import { TermsPageComponent } from './pages/terms-page.component';
import { LoginPageComponent } from './pages/login-page.component';
import { OpenClawMcpPageComponent } from './pages/openclaw-mcp-page.component';
import { MedlineAiPageComponent } from './pages/medline-ai-page.component';

export const routes: Routes = [
  // Marketing routes (prerendered)
  { path: '', component: HomePageComponent },
  { path: 'how-it-works', component: HowItWorksPageComponent },
  { path: 'use-cases', component: UseCasesPageComponent },
  { path: 'technology', component: TechnologyPageComponent },
  { path: 'products', component: ProductsPageComponent },
  { path: 'truviz', component: TruVizPageComponent },
  { path: 'audit', component: AuditPageComponent },
  { path: 'pricing', component: PricingPageComponent },
  { path: 'investors', component: InvestorsPageComponent },
  { path: 'openclaw-mcp', component: OpenClawMcpPageComponent },
  { path: 'medline-ai', component: MedlineAiPageComponent },
  { path: 'legal/privacy', component: PrivacyPageComponent },
  { path: 'legal/terms', component: TermsPageComponent },
  
  // App routes (dynamic)
  { path: 'login', component: LoginPageComponent }, // Login page
  { path: 'verify', component: VerifyPageComponent }, // Main verify tool (was /verify/tool)
  { path: 'verify/tool', redirectTo: '/verify', pathMatch: 'full' }, // Redirect old path
  { path: 't/:id', component: PublicVerifyComponent },
  
  // Legacy redirects
  { path: 'app/verify', redirectTo: '/verify', pathMatch: 'full' },
  { path: 'app/t/:id', redirectTo: '/t/:id', pathMatch: 'full' },
  { path: 'app', redirectTo: '/', pathMatch: 'full' },
  
  // Catch-all
  { path: '**', redirectTo: '/' }
];
