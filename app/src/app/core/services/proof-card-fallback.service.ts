import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

/**
 * Service to handle proof card image loading with fallback regeneration
 * If a proof card is missing (404), it triggers regeneration via the API
 */
@Injectable({
  providedIn: 'root'
})
export class ProofCardFallbackService {
  private readonly apiUrl = environment.apiUrl || 'http://localhost:5000';

  constructor(private http: HttpClient) {}

  /**
   * Get proof card URL with automatic fallback to regeneration endpoint
   * @param proofId Proof ID (e.g., TW-7F39C1AB)
   * @param size Image size (640 or 1024)
   * @returns Observable with the final working URL
   */
  getProofCardUrl(proofId: string, size: 640 | 1024 = 640): Observable<string> {
    const staticUrl = `${this.apiUrl}/assets/proof/${proofId}-${size}.png`;
    const regenerateUrl = `${this.apiUrl}/cards/proof/${proofId}-${size}.png`;

    // Try static URL first (fast path)
    return this.http.head(staticUrl, { observe: 'response' }).pipe(
      switchMap(() => of(staticUrl)), // Static file exists, use it
      catchError((error: HttpErrorResponse) => {
        if (error.status === 404) {
          // Static file missing, trigger regeneration
          console.log(`Proof card not found, regenerating: ${proofId}-${size}.png`);
          
          return this.http.get(regenerateUrl, { 
            responseType: 'blob',
            observe: 'response'
          }).pipe(
            switchMap(() => of(staticUrl)), // After regeneration, use static URL
            catchError(regenerateError => {
              console.error('Failed to regenerate proof card:', regenerateError);
              return throwError(() => regenerateError);
            })
          );
        }
        
        // Other errors (network, server error, etc.)
        return throwError(() => error);
      })
    );
  }

  /**
   * Preload proof card image (useful for ensuring cards are generated)
   * @param proofId Proof ID
   * @param size Image size
   * @returns Observable that completes when card is ready
   */
  preloadProofCard(proofId: string, size: 640 | 1024 = 640): Observable<void> {
    return this.getProofCardUrl(proofId, size).pipe(
      switchMap(() => of(void 0))
    );
  }

  /**
   * Get both proof card URLs (small and large)
   * @param proofId Proof ID
   * @returns Object with both URLs
   */
  getProofCardUrls(proofId: string): { small: string; large: string } {
    return {
      small: `${this.apiUrl}/assets/proof/${proofId}-640.png`,
      large: `${this.apiUrl}/assets/proof/${proofId}-1024.png`
    };
  }
}

