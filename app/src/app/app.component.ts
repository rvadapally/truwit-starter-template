import { Component, ChangeDetectionStrategy, type OnInit, type OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subject, takeUntil, filter } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit, OnDestroy {
  currentYear = new Date().getFullYear();
  currentRoute = '/'; // Start with home page

  private destroy$ = new Subject<void>();

  constructor(private router: Router) {
    console.log('🚀 AppComponent constructor called');
    console.log('📍 Current URL:', window.location.href);
    console.log('🔗 Router:', router);
  }

  ngOnInit(): void {
    console.log('🎯 AppComponent ngOnInit called');
    console.log('📍 Initial route:', this.currentRoute);
    
    // Track route changes
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event) => {
        this.currentRoute = (event as NavigationEnd).url;
        console.log('🔄 Route changed to:', this.currentRoute);
        console.log('📍 Full URL:', window.location.href);
      });
  }

  ngOnDestroy(): void {
    console.log('💀 AppComponent ngOnDestroy called');
    this.destroy$.next();
    this.destroy$.complete();
  }
}