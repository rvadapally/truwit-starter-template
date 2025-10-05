import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { VerificationFormComponent } from './components/verification-form.component';
import { VerificationResultComponent } from './components/verification-result.component';
import { PublicVerifyComponent } from './components/public-verify.component';

@NgModule({
  declarations: [
    VerificationFormComponent,
    VerificationResultComponent,
    PublicVerifyComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  exports: [
    VerificationFormComponent,
    VerificationResultComponent,
    PublicVerifyComponent
  ]
})
export class VerificationModule { }
