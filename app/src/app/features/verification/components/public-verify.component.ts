import { Component, ChangeDetectionStrategy, ChangeDetectorRef, type OnInit, type OnDestroy } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { VerificationService } from '../../../core/services/verification.service';
import { NotificationService } from '../../../core/services/notification.service';
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
  embedCode: string = '';
  
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private verificationService: VerificationService,
    private cdr: ChangeDetectorRef,
    private notificationService: NotificationService,
    private title: Title,
    private meta: Meta
  ) {}

  ngOnInit(): void {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.proofId = params['id'];
        if (this.proofId) {
          this.loadVerifyData();
        }
        this.cdr.markForCheck();
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
    this.cdr.markForCheck();
    
    this.verificationService.verifyProof(this.proofId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.verifyData = data;
          this.isLoading = false;
          this.updateMetaTags();
          this.updateEmbedCode();
          this.cdr.markForCheck();
        },
        error: (error) => {
          const errorMsg = error.message || 'Failed to load verification data';
          this.error = errorMsg;
          this.notificationService.showError(errorMsg);
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      });
  }

  private updateMetaTags(): void {
    if (!this.verifyData) return;
    const proofId = this.verifyData.proofId;
    const pageUrl = window.location.href;

    // Prefer provided badgeUrl; ensure it is absolute for OG
    let imageUrl = this.verifyData.badgeUrl;
    if (imageUrl && !/^https?:\/\//i.test(imageUrl)) {
      // If relative, prefix with current origin
      imageUrl = new URL(imageUrl, window.location.origin).toString();
    }

    this.title.setTitle(`Verified by TruWit: ${proofId}`);
    this.meta.updateTag({ name: 'description', content: `Verification details for ${proofId}` });

    // Open Graph
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:title', content: `Verified by TruWit: ${proofId}` });
    this.meta.updateTag({ property: 'og:description', content: `View verification and provenance for ${proofId}` });
    if (imageUrl) this.meta.updateTag({ property: 'og:image', content: imageUrl });
    this.meta.updateTag({ property: 'og:url', content: pageUrl });

    // Twitter
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: `Verified by TruWit: ${proofId}` });
    this.meta.updateTag({ name: 'twitter:description', content: `View verification and provenance for ${proofId}` });
    if (imageUrl) this.meta.updateTag({ name: 'twitter:image', content: imageUrl });
  }

  private updateEmbedCode(): void {
    if (!this.verifyData) {
      this.embedCode = '';
      return;
    }
    const id = this.verifyData.proofId;
    const verificationUrl = `https://truwit.ai/app/t/${id}`;
    // Prefer provided badgeUrl, else fall back to API proof card (800px)
    let imageUrl = this.verifyData.badgeUrl;
    if (!imageUrl) {
      const origin = window?.location?.origin || '';
      // Fallback to same-origin API guess; replace with production API if needed
      imageUrl = `${origin.replace(/\/$/, '')}/assets/proof/${id}-800.png`;
    } else if (!/^https?:\/\//i.test(imageUrl)) {
      imageUrl = new URL(imageUrl, window.location.origin).toString();
    }

    this.embedCode = `<a href="${verificationUrl}" target="_blank" rel="noopener">
  <img src="${imageUrl}" alt="Verified by TruWit" />
</a>`;
  }

  copyEmbedCodeFromVerification(): void {
    if (!this.embedCode) return;
    navigator.clipboard.writeText(this.embedCode).then(() => {
      this.notificationService.showSuccess('Embed code copied!');
    }).catch(() => {
      this.notificationService.showError('Failed to copy embed code');
    });
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.notificationService.showSuccess('Copied to clipboard!');
    }).catch(() => {
      this.notificationService.showError('Failed to copy to clipboard');
    });
  }

  copyVerificationLink(): void {
    const currentUrl = window.location.href;
    navigator.clipboard.writeText(currentUrl).then(() => {
      this.notificationService.showSuccess('Verification link copied to clipboard!');
    }).catch(() => {
      this.notificationService.showError('Failed to copy verification link');
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

  formatUtcTime(isoString: string): string {
    return new Date(isoString).toLocaleString('en-US', { 
      timeZone: 'UTC', 
      timeZoneName: 'short' 
    });
  }

  formatLocalTime(isoString: string): string {
    return new Date(isoString).toLocaleString('en-US', { 
      timeZoneName: 'short' 
    });
  }

  getC2paStatusText(origin: any): string {
    if (!origin) return 'Not checked';
    if (origin.c2pa && origin.status === 'valid') return '✓ Signed';
    if (origin.status === 'not_applicable_thumbnail') return 'Skipped (thumbnail mode)';
    return 'Not signed';
  }

  getC2paStatusClass(origin: any): string {
    if (!origin) return 'status-neutral';
    if (origin.c2pa && origin.status === 'valid') return 'status-success';
    return 'status-neutral'; // No red
  }

  getBadgeUrl(): string {
    if (!this.verifyData) {
      return '/assets/signed_badge.png'; // fallback with leading slash
    }
    
    // Try dynamic badge first, fallback to static
    return this.verifyData.badgeUrl || '/assets/signed_badge.png';
  }

  onBadgeError(event: any): void {
    // Fallback to static badge if dynamic fails
    event.target.src = '/assets/signed_badge.png';
  }
}
