import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { VerificationFormComponent } from './components/verification-form.component';
import { PublicVerifyComponent } from './components/public-verify.component';
import { VerificationResultComponent } from './components/verification-result.component';

@NgModule({
  declarations: [
    PublicVerifyComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HttpClientModule,
    VerificationFormComponent,
    VerificationResultComponent
  ],
  exports: [
    VerificationFormComponent,
    PublicVerifyComponent,
    VerificationResultComponent
  ]
})
export class VerificationModule { }
