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
   * Get dynamic badge SVG for a proof ID
   */
  getBadgeSvg(proofId: string): Observable<string> {
    return this.http.get(`${this.apiUrl}/v1/badge/${proofId}.svg`, {
      responseType: 'text'
    });
  }

  /**
   * Get dynamic badge PNG for a proof ID
   */
  getBadgePng(proofId: string): Observable<string> {
    return this.http.get(`${this.apiUrl}/v1/badge/${proofId}.png`, {
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
   * Generate badge URL for a proof ID
   */
  getBadgeUrl(proofId: string): string {
    return `${this.apiUrl}/v1/badge/${proofId}.svg`;
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
  generateEmbedHtml(proofId: string): string {
    const badgeUrl = this.getBadgeUrl(proofId);
    const verificationUrl = this.getVerificationUrl(proofId);
    
    return `<a href="${verificationUrl}" target="_blank">
      <img src="${badgeUrl}" alt="Verified by Truwit" style="max-width: 200px; height: auto;" />
    </a>`;
  }

  /**
   * Generate markdown code for a proof ID
   */
  generateMarkdownCode(proofId: string): string {
    const badgeUrl = this.getBadgeUrl(proofId);
    const verificationUrl = this.getVerificationUrl(proofId);
    
    return `[![Verified by Truwit](${badgeUrl})](${verificationUrl})`;
  }
}
