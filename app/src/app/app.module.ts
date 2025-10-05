import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { VerificationModule } from './features/verification/verification.module';
import { HomeComponent } from './features/home/home.component';
import { VerifyPageComponent } from './features/verification/components/verify-page.component';
import { routes } from './app.routes';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    VerifyPageComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    RouterModule.forRoot(routes),
    VerificationModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { 
  constructor() {
    console.log('📦 AppModule constructor called');
    console.log('🔗 Routes:', routes);
  }
}