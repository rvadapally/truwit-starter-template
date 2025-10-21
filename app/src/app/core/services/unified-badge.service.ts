import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface BadgeConfig {
  useCircularOnly: boolean;
  preferredSize: number;
  fallbackToStatic: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UnifiedBadgeService {
  private readonly apiUrl = environment.apiUrl || 'https://api.truwit.ai';
  private readonly config: BadgeConfig = {
    useCircularOnly: true,
    preferredSize: 800,
    fallbackToStatic: true
  };

  constructor(private http: HttpClient) {}

  /**
   * Get the BEST available badge URL for a proof ID
   * Priority: New proof cards > Circular static badge > Fallback
   */
  getBestBadgeUrl(proofId: string, size: number = this.config.preferredSize): Observable<string> {
    // Try new proof card first (beautiful teal cards with QR codes)
    const proofCardUrl = `${this.apiUrl}/cards/proof/${proofId}-${size}.png`;
    
    return this.http.head(proofCardUrl).pipe(
      map(() => proofCardUrl), // Proof card exists, use it
      catchError(() => {
        // Proof card doesn't exist, use circular static badge
        if (this.config.fallbackToStatic) {
          return of('/assets/verified-circular-badge.jpg');
        }
        throw new Error('No badge available');
      })
    );
  }

  /**
   * Get circular badge URL (guaranteed to be circular)
   */
  getCircularBadgeUrl(proofId: string, size: number = this.config.preferredSize): string {
    // Always prefer the new proof cards (they are circular/square with QR codes)
    return `${this.apiUrl}/cards/proof/${proofId}-${size}.png`;
  }

  /**
   * Get static circular badge URL (fallback)
   */
  getStaticCircularBadgeUrl(): string {
    return '/assets/verified-circular-badge.jpg';
  }

  /**
   * Generate embed HTML with circular badge
   */
  generateCircularEmbedHtml(proofId: string, size: number = this.config.preferredSize): string {
    const badgeUrl = this.getCircularBadgeUrl(proofId, size);
    const verificationUrl = `https://truwit.ai/app/t/${proofId}`;
    
    return `<a href="${verificationUrl}" target="_blank">
      <img src="${badgeUrl}" alt="Verified by Truwit" style="max-width: 200px; height: auto; border-radius: 50%;" />
    </a>`;
  }

  /**
   * Check if badge URL is circular/square format
   */
  isCircularBadge(url: string): boolean {
    // New proof cards are square/circular with QR codes
    if (url.includes('/cards/proof/')) return true;
    
    // Static circular badge
    if (url.includes('verified-circular-badge')) return true;
    
    // Old badges are rectangular
    if (url.includes('/v1/badge/')) return false;
    
    return false;
  }

  /**
   * Force circular badge display by replacing rectangular badges
   */
  ensureCircularBadge(originalUrl: string, proofId: string): string {
    if (this.isCircularBadge(originalUrl)) {
      return originalUrl; // Already circular
    }
    
    // Replace rectangular badge with circular proof card
    return this.getCircularBadgeUrl(proofId);
  }
}
