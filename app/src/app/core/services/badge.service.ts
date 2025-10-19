import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface BadgeData {
  proofId: string;
  trustmarkId: string;
  badgeUrl: string;
  embedCode: string;
  markdownCode: string;
}

export interface BadgeEmbedResponse {
  html: string;
  markdown: string;
  url: string;
}

@Injectable({
  providedIn: 'root'
})
export class BadgeService {
  private readonly apiUrl = environment.apiUrl || 'https://api.truwit.ai';

  constructor(private http: HttpClient) {}

  /**
   * Get dynamic proof card PNG for a proof ID
   */
  getProofCard(proofId: string, size: number = 800): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/assets/proof/${proofId}-${size}.png`, {
      responseType: 'blob'
    });
  }

  /**
   * Get dynamic badge SVG for a proof ID (legacy fallback)
   */
  getBadgeSvg(proofId: string): Observable<string> {
    return this.http.get(`${this.apiUrl}/v1/badge/${proofId}.svg`, {
      responseType: 'text'
    });
  }

  /**
   * Get embed code for a proof ID
   */
  getBadgeEmbed(proofId: string): Observable<BadgeEmbedResponse> {
    return this.http.get<BadgeEmbedResponse>(`${this.apiUrl}/v1/badge/${proofId}/embed`);
  }

  /**
   * Generate proof card URL for a proof ID
   */
  getBadgeUrl(proofId: string, size: number = 800): string {
    return `${this.apiUrl}/assets/proof/${proofId}-${size}.png`;
  }

  /**
   * Generate verification page URL for a proof ID
   */
  getVerificationUrl(proofId: string): string {
    return `https://truwit.ai/app/t/${proofId}`;
  }

  /**
   * Generate embed HTML for a proof ID
   */
  generateEmbedHtml(proofId: string, size: number = 800): string {
    const badgeUrl = this.getBadgeUrl(proofId, size);
    const verificationUrl = this.getVerificationUrl(proofId);
    
    return `<a href="${verificationUrl}" target="_blank">
      <img src="${badgeUrl}" alt="Verified by Truwit" style="max-width: 200px; height: auto;" />
    </a>`;
  }

  /**
   * Generate markdown code for a proof ID
   */
  generateMarkdownCode(proofId: string, size: number = 800): string {
    const badgeUrl = this.getBadgeUrl(proofId, size);
    const verificationUrl = this.getVerificationUrl(proofId);
    
    return `[![Verified by Truwit](${badgeUrl})](${verificationUrl})`;
  }
}
