import { Component, Input, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-dynamic-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dynamic-badge-container">
      <!-- Loading State -->
      <div class="badge-loading" *ngIf="isLoading">
        <div class="loading-spinner"></div>
        <span class="loading-text">Loading badge...</span>
      </div>

      <!-- Error/Fallback State with Circular Badge -->
      <div class="badge-fallback" *ngIf="hasError">
        <div class="circular-badge-wrapper">
          <img 
            src="assets/signed_badge.png" 
            alt="Verified by Truwit"
            class="circular-badge-image">
        </div>
        <div class="proof-id-display">
          <div class="proof-id-label">VERIFICATION ID</div>
          <div class="proof-id-large">{{ trustmarkId || proofId }}</div>
        </div>
        <button class="action-button primary" (click)="viewVerification()" *ngIf="showActions">
          View Full Verification
        </button>
      </div>

      <!-- Badge Display -->
      <div class="badge-display" *ngIf="!isLoading && !hasError && badgeUrl">
        <a (click)="viewVerification()" class="badge-link" title="View verification">
          <img 
            [src]="badgeUrl" 
            [alt]="altText"
            class="badge-image"
            (load)="onImageLoad()"
            (error)="onImageError()"
            [class.loaded]="imageLoaded">
        </a>
        
        <!-- Badge Actions -->
        <div class="badge-actions" *ngIf="showActions">
          <button class="action-button primary" (click)="viewVerification()">
            View Verification
          </button>
          <button class="action-button secondary" (click)="copyEmbedCode()">
            Copy Embed Code
          </button>
          <button class="action-button secondary" (click)="downloadBadge()">
            Download Badge
          </button>
        </div>

        <!-- Proof ID Display -->
        <div class="proof-info" *ngIf="showProofId">
          <span class="proof-label">Proof ID:</span>
          <code class="proof-id">{{ proofId }}</code>
          <button class="copy-button" (click)="copyProofId()" title="Copy Proof ID">
            📋
          </button>
        </div>
      </div>

      <!-- Fallback Static Badge -->
      <div class="static-badge-fallback" *ngIf="!isLoading && !hasError && !badgeUrl && useFallback">
        <img 
          src="assets/signed_badge.png" 
          alt="Verified by Truwit"
          class="badge-image">
        <div class="fallback-text">Static Badge</div>
      </div>
    </div>
  `,
  styles: [`
    .dynamic-badge-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: rgba(14, 27, 53, 0.4);
      border: 1px solid rgba(14, 165, 233, 0.2);
      border-radius: 16px;
      max-width: 400px;
      margin: 0 auto;
    }

    .badge-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      color: #0ea5e9;
    }

    .loading-spinner {
      width: 24px;
      height: 24px;
      border: 3px solid rgba(14, 165, 233, 0.3);
      border-top: 3px solid #0ea5e9;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .loading-text {
      font-size: 0.9rem;
      opacity: 0.8;
    }

    .badge-fallback {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.5rem;
      padding: 2rem 1rem;
      width: 100%;
    }

    .circular-badge-wrapper {
      width: 180px;
      height: 180px;
      border-radius: 50%;
      overflow: hidden;
      box-shadow: 0 8px 24px rgba(14, 165, 233, 0.3);
      border: 3px solid #0ea5e9;
    }

    .circular-badge-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .proof-id-display {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem 1.5rem;
      background: linear-gradient(135deg, rgba(14, 165, 233, 0.15), rgba(34, 197, 94, 0.15));
      border: 2px solid rgba(14, 165, 233, 0.4);
      border-radius: 12px;
      width: 100%;
      max-width: 300px;
    }

    .proof-id-label {
      color: #9fb3d9;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 600;
    }

    .proof-id-large {
      color: #e6eefc;
      font-size: 1.5rem;
      font-weight: 700;
      font-family: 'Courier New', monospace;
      letter-spacing: 2px;
      text-align: center;
      word-break: break-all;
    }

    .badge-display {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      width: 100%;
    }

    .badge-image {
      max-width: 200px;
      height: auto;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(14, 165, 233, 0.2);
      transition: all 0.3s ease;
      opacity: 0;
    }

    .badge-image.loaded {
      opacity: 1;
      transform: scale(1);
    }

    .badge-image:hover {
      transform: scale(1.05);
      box-shadow: 0 6px 16px rgba(14, 165, 233, 0.3);
    }

    .badge-actions {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      width: 100%;
    }

    .action-button {
      padding: 0.75rem 1rem;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.2s;
      text-align: center;
    }

    .action-button.primary {
      background: linear-gradient(135deg, #0ea5e9, #22c55e);
      color: white;
    }

    .action-button.primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
    }

    .action-button.secondary {
      background: rgba(14, 165, 233, 0.2);
      color: #0ea5e9;
      border: 1px solid rgba(14, 165, 233, 0.3);
    }

    .action-button.secondary:hover {
      background: rgba(14, 165, 233, 0.3);
    }

    .proof-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
      background: rgba(14, 165, 233, 0.1);
      border: 1px solid rgba(14, 165, 233, 0.2);
      border-radius: 8px;
      font-size: 0.8rem;
      width: 100%;
    }

    .proof-label {
      color: #9fb3d9;
      font-weight: 500;
    }

    .proof-id {
      background: rgba(11, 18, 32, 0.8);
      color: #e6eefc;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 0.75rem;
      flex: 1;
      text-align: center;
    }

    .copy-button {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1rem;
      padding: 0.25rem;
      border-radius: 4px;
      transition: background 0.2s;
    }

    .copy-button:hover {
      background: rgba(14, 165, 233, 0.2);
    }

    .static-badge-fallback {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .fallback-text {
      color: #9fb3d9;
      font-size: 0.8rem;
      opacity: 0.7;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
      .dynamic-badge-container {
        padding: 0.75rem;
      }

      .badge-image {
        max-width: 150px;
      }

      .badge-actions {
        gap: 0.75rem;
      }

      .action-button {
        padding: 0.875rem 1rem;
        font-size: 1rem;
      }

      .circular-badge-wrapper {
        width: 140px;
        height: 140px;
      }
      
      .proof-id-large {
        font-size: 1.2rem;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DynamicBadgeComponent implements OnInit, OnDestroy {
  @Input() proofId!: string;
  @Input() trustmarkId?: string;
  @Input() showActions: boolean = true;
  @Input() showProofId: boolean = true;
  @Input() useFallback: boolean = true;
  @Input() altText: string = 'Verified by Truwit';

  badgeUrl: string | null = null;
  isLoading: boolean = false;
  hasError: boolean = false;
  imageLoaded: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    if (this.proofId) {
      this.loadBadge();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadBadge(): void {
    const badgeId = this.trustmarkId || this.proofId;
    if (!badgeId) return;

    this.isLoading = true;
    this.hasError = false;
    this.imageLoaded = false;

    // Force HTTPS and strip trailing slash
    let apiUrl = (environment.apiUrl || 'https://api.truwit.ai').trim();
    if (apiUrl.startsWith('http://')) apiUrl = 'https://' + apiUrl.substring('http://'.length);
    apiUrl = apiUrl.replace(/\/$/, '');
    
    // Try to load badge from correct endpoint first (FIXED: Use correct API path)
    const badgeUrl = `${apiUrl}/v1/badge/${badgeId}.svg`;
    
    // Check if badge exists by making a HEAD request
    this.http.head(badgeUrl, { observe: 'response' })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          // Badge exists, use it
          this.badgeUrl = badgeUrl;
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Error loading badge:', error);
          this.hasError = true;
          this.isLoading = false;
        }
      });
  }

  private pollUntilAvailable(url: string, retries: number, delayMs: number): Promise<void> {
    const attempt = (n: number): Promise<void> => {
      return new Promise<void>((resolve, reject) => {
        // Add cache-busting to avoid CDN stale responses during polling
        const bustUrl = url + (url.includes('?') ? '&' : '?') + 'v=' + Date.now();
        this.http.head(bustUrl, { observe: 'response' })
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (resp) => {
              if (resp.status >= 200 && resp.status < 300) {
                resolve();
              } else if (n <= 0) {
                reject();
              } else {
                setTimeout(() => attempt(n - 1).then(resolve).catch(reject), delayMs);
                delayMs = Math.min(delayMs * 2, 2000);
              }
            },
            error: () => {
              if (n <= 0) {
                reject();
              } else {
                setTimeout(() => attempt(n - 1).then(resolve).catch(reject), delayMs);
                delayMs = Math.min(delayMs * 2, 2000);
              }
            }
          });
      });
    };
    return attempt(retries);
  }

  private fallbackToOldBadge(badgeId: string): void {
    // Fallback to old SVG badge system
    const apiUrl = environment.apiUrl || 'https://api.truwit.ai';
    this.http.get(`${apiUrl}/v1/badge/${badgeId}.svg`, { responseType: 'text' })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (svgContent: string) => {
          // Convert SVG content to data URL
          const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' });
          const url = URL.createObjectURL(svgBlob);
          this.badgeUrl = url;
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Error loading fallback badge:', error);
          this.hasError = true;
          this.isLoading = false;
        }
      });
  }

  onImageLoad(): void {
    this.imageLoaded = true;
  }

  onImageError(): void {
    this.hasError = true;
    this.isLoading = false;
  }

  viewVerification(): void {
    const badgeId = this.trustmarkId || this.proofId;
    const verificationUrl = `https://truwit.ai/app/#/t/${badgeId}`;
    window.open(verificationUrl, '_blank');
  }

  copyEmbedCode(): void {
    const badgeId = this.trustmarkId || this.proofId;
    const apiUrl = environment.apiUrl || 'https://api.truwit.ai';
    const badgeUrl = this.badgeUrl || `${apiUrl}/assets/proof/${badgeId}-800.png`;
    const verificationUrl = `https://truwit.ai/app/#/t/${badgeId}`;
    const embedCode = `<a href="${verificationUrl}" target="_blank">
      <img src="${badgeUrl}" alt="Verified by Truwit" style="max-width: 200px; height: auto;" />
    </a>`;
    
    navigator.clipboard.writeText(embedCode).then(() => {
      console.log('Embed code copied to clipboard');
    });
  }

  downloadBadge(): void {
    if (this.badgeUrl) {
      const badgeId = this.trustmarkId || this.proofId;
      const link = document.createElement('a');
      link.href = this.badgeUrl;
      link.download = `truwit-proof-card-${badgeId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  copyProofId(): void {
    navigator.clipboard.writeText(this.proofId).then(() => {
      console.log('Proof ID copied to clipboard');
    });
  }
}
