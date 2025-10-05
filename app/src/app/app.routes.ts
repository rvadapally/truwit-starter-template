import type { Routes } from '@angular/router';
import { PublicVerifyComponent } from './features/verification/components/public-verify.component';

export const routes: Routes = [
  {
    path: 't/:id',
    component: PublicVerifyComponent
  },
  {
    path: '',
    redirectTo: '/',
    pathMatch: 'full'
  }
];