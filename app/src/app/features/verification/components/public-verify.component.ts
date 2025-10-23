import { Component, ChangeDetectionStrategy, ChangeDetectorRef, type OnInit, type OnDestroy } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { VerificationService } from '../../../core/services/verification.service';
import { NotificationService } from '../../../core/services/notification.service';
import type { VerifyResponse } from '../../../core/models';
import { environment } from '../../../../environments/environment';
import { UnifiedBadgeService } from '../../../core/services/unified-badge.service';

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
    private meta: Meta,
    private unifiedBadgeService: UnifiedBadgeService
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
    
    // Use trustmark ID for verification since the URL uses trustmark ID
    const trustmarkId = this.getTrustmarkIdFromUrl();
    this.verificationService.verifyProof(trustmarkId)
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

    // Use the same logic as getBadgeUrl() for consistency
    let imageUrl = this.verifyData.badgeUrl;
    if (!imageUrl) {
      // Use the correct API endpoint for badges with HTTPS
      const trustmarkId = this.getTrustmarkIdFromUrl();
      imageUrl = `https://api.truwit.ai/assets/proof/${trustmarkId}-800.png`;
    } else if (!/^https?:\/\//i.test(imageUrl)) {
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
    
    // Use trustmarkId for URL consistency (matches the actual verification URL)
    const trustmarkId = this.getTrustmarkIdFromUrl();
    const verificationUrl = `https://truwit.ai/app/t/${trustmarkId}`;
    
    // Use the correct badge URL format
    let imageUrl = this.verifyData.badgeUrl;
    if (!imageUrl) {
      // Use the NEW proof card endpoint for beautiful cards with QR codes
      const apiUrl = environment.apiUrl || 'https://api.truwit.ai';
      imageUrl = `${apiUrl}/cards/proof/${trustmarkId}-800.png`;
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
      this.notificationService.showSuccess("Embed code copied!");
    }).catch(() => {
      this.notificationService.showError("Failed to copy embed code");
    });
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.notificationService.showSuccess("Copied to clipboard!");
    }).catch(() => {
      this.notificationService.showError("Failed to copy to clipboard");
    });
  }

  copyVerificationLink(): void {
    const currentUrl = window.location.href;
    navigator.clipboard.writeText(currentUrl).then(() => {
      this.notificationService.showSuccess("Verification link copied to clipboard!");
    }).catch(() => {
      this.notificationService.showError("Failed to copy verification link");
    });
  }

  copyImageUrl(): void {
    const url = this.getBadgeUrl();
    navigator.clipboard.writeText(url).then(() => {
      this.notificationService.showSuccess("Image URL copied!");
    }).catch(() => {
      this.notificationService.showError("Failed to copy image URL");
    });
  }

  shareToX(): void {
    if (!this.verifyData) return;
    const text = `Verified by Truwit: ${this.verifyData.proofId}`;
    const url = window.location.href;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, "_blank");
  }

  async shareToXWithImage(): Promise<void> {
    if (!this.verifyData) return;

    // Build absolute image URL using the NEW proof card endpoint
    let imgUrl = this.verifyData.badgeUrl || '';
    if (!imgUrl) {
      // Use the NEW proof card endpoint for beautiful cards with QR codes
      const trustmarkId = this.getTrustmarkIdFromUrl();
      const apiUrl = environment.apiUrl || 'https://api.truwit.ai';
      imgUrl = `${apiUrl}/cards/proof/${trustmarkId}-800.png`;
    } else if (!/^https?:\/\//i.test(imgUrl)) {
      imgUrl = new URL(imgUrl, window.location.origin).toString();
    }

    // Attempt to copy image to clipboard (best-effort)
    let copied = false;
    try {
      if (imgUrl && navigator.clipboard && (window as any).ClipboardItem) {
        const resp = await fetch(imgUrl, { cache: 'no-cache' });
        const blob = await resp.blob();
        const item = new (window as any).ClipboardItem({ [blob.type]: blob });
        await (navigator.clipboard as any).write([item]);
        copied = true;
        this.notificationService.showSuccess('Beautiful proof card copied! Paste it in X composer.');
      }
    } catch {
      // Ignore; we will still open the share URL
      this.notificationService.showError('Could not copy image automatically. You can attach it manually.');
    }

    // Open X share intent with verification page URL and descriptive text
    const text = `✅ Verified by Truwit! 

This content has been cryptographically verified for authenticity and provenance. Scan the QR code or click to verify.

#Verified #Truwit #Provenance #Trust #AI #ContentVerification`;
    const url = window.location.href;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank');

    if (!copied && imgUrl) {
      // Fallback: open image in a new tab so user can save/attach quickly
      window.open(imgUrl, '_blank');
    }
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
      return this.unifiedBadgeService.getStaticCircularBadgeUrl();
    }
    
    // Use unified badge service to ensure circular badge
    const trustmarkId = this.getTrustmarkIdFromUrl();
    return this.unifiedBadgeService.getCircularBadgeUrl(trustmarkId, 800);
  }

  onBadgeError(event: any): void {
    // Fallback to static badge if dynamic fails
    event.target.src = 'assets/signed_badge.png';
  }

  private getTrustmarkIdFromUrl(): string {
    // Extract trustmark ID from current URL path
    const currentUrl = window.location.href;
    const match = currentUrl.match(/\/t\/([^\/\?#]+)/);
    return match ? match[1] : this.proofId || '';
  }
}
















