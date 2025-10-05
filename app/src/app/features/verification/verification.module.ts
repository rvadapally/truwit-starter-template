import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { VerificationFormComponent } from './components/verification-form.component';
import { VerificationResultComponent } from './components/verification-result.component';

@NgModule({
  declarations: [
    VerificationFormComponent,
    VerificationResultComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  exports: [
    VerificationFormComponent,
    VerificationResultComponent
  ]
})
export class VerificationModule { }
