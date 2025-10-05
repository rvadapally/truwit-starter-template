import type { Routes } from '@angular/router';
import { PublicVerifyComponent } from './features/verification/components/public-verify.component';
import { HomeComponent } from './features/home/home.component';
import { VerifyPageComponent } from './features/verification/components/verify-page.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'verify',
    component: VerifyPageComponent
  },
  {
    path: 't/:id',
    component: PublicVerifyComponent
  },
  {
    path: '**',
    redirectTo: '/'
  }
];