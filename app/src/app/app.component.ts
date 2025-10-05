import { Component, ChangeDetectionStrategy, type OnInit, type OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subject, takeUntil, filter } from 'rxjs';
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
    private verificationService: VerificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.verificationService.verificationResult$
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.verificationResult = result;
      });

    // Track route changes
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event) => {
        this.currentRoute = (event as NavigationEnd).url;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  navigateToVerification(): void {
    this.router.navigate(['/verify']);
  }

  navigateToHome(): void {
    this.router.navigate(['/']);
  }

  onNewVerification(): void {
    this.verificationService.clearVerificationResult();
    this.router.navigate(['/verify']);
  }
}