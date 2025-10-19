import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppComponent } from './app.component';
import { VerificationModule } from './features/verification/verification.module';
import { HomeComponent } from './features/home/home.component';
import { VerifyPageComponent } from './features/verification/components/verify-page.component';
import { ToastNotificationComponent } from './shared/components/toast-notification/toast-notification.component';
import { routes } from './app.routes';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    VerifyPageComponent,
    ToastNotificationComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    RouterModule.forRoot(routes),
    VerificationModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }