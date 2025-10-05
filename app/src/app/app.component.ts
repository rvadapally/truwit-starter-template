import { Component, ChangeDetectionStrategy, type OnInit, type OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { VerificationService } from './core/services/verification.service';
import type { VerificationResult } from './core/models';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit, OnDestroy {
  verificationResult: VerificationResult | null = null;
  currentYear = new Date().getFullYear();
  currentRoute = '/'; // Start with home page
  
  private destroy$ = new Subject<void>();

  constructor(
    private verificationService: VerificationService
  ) {}

  ngOnInit(): void {
    this.verificationService.verificationResult$
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.verificationResult = result;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  navigateToVerification(): void {
    this.currentRoute = '/verify';
  }

  navigateToHome(): void {
    this.currentRoute = '/';
  }

  onNewVerification(): void {
    this.verificationService.clearVerificationResult();
    this.currentRoute = '/verify';
  }
}