import { Component, ChangeDetectionStrategy, ChangeDetectorRef, type OnInit, type OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subject, takeUntil, filter } from 'rxjs';
import { HeaderComponent } from './layout/header/header.component';
import { FooterComponent } from './layout/footer/footer.component';
import { ToastNotificationComponent } from './shared/components/toast-notification/toast-notification.component';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, FooterComponent, ToastNotificationComponent]
})
export class AppComponent implements OnInit, OnDestroy {
  currentYear = new Date().getFullYear();
  currentRoute = '/'; // Start with home page

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Track route changes
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event) => {
        const url = (event as NavigationEnd).url;
        this.currentRoute = url;
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  goToLandingPage(): void {
    // Navigate to the main truwit.ai landing page
    window.location.href = 'https://truwit.ai';
  }
}