import { Component, ChangeDetectionStrategy, type OnInit, type OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { VerificationService } from '../../../core/services/verification.service';
import type { VerifyResponse } from '../../../core/models';

@Component({
  selector: 'app-public-verify',
  templateUrl: './public-verify.component.html',
  styleUrls: ['./public-verify.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PublicVerifyComponent implements OnInit, OnDestroy {
  proofId: string | null = null;
  verifyData: VerifyResponse | null = null;
  isLoading = true;
  error: string | null = null;
  
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private verificationService: VerificationService
  ) {}

  ngOnInit(): void {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.proofId = params['id'];
        if (this.proofId) {
          this.loadVerifyData();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadVerifyData(): void {
    if (!this.proofId) return;
    
    this.isLoading = true;
    this.error = null;
    
    this.verificationService.verifyProof(this.proofId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.verifyData = data;
          this.isLoading = false;
        },
        error: (error) => {
          this.error = error.message || 'Failed to load verification data';
          this.isLoading = false;
        }
      });
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      // TODO: Show toast notification
      console.log('Copied to clipboard:', text);
    });
  }

  shareToX(): void {
    if (!this.verifyData) return;
    
    const text = `Verified by Truwit: ${this.verifyData.proofId}`;
    const url = window.location.href;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    
    window.open(twitterUrl, '_blank');
  }

  getVerdictColor(): string {
    if (!this.verifyData) return 'gray';
    
    switch (this.verifyData.verdict) {
      case 'green': return '#22c55e';
      case 'yellow': return '#eab308';
      case 'red': return '#ef4444';
      default: return 'gray';
    }
  }

  getVerdictText(): string {
    if (!this.verifyData) return 'Unknown';
    
    switch (this.verifyData.verdict) {
      case 'green': return 'Verified';
      case 'yellow': return 'Caution';
      case 'red': return 'Unverified';
      default: return 'Unknown';
    }
  }
}
