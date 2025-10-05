import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { VerificationRequest, VerificationResult, ProofDetails } from '../models';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class VerificationService {
  private verificationResultSubject = new BehaviorSubject<VerificationResult | null>(null);
  public verificationResult$ = this.verificationResultSubject.asObservable();

  constructor(private apiService: ApiService) {}

  verifyContent(request: VerificationRequest): Observable<VerificationResult> {
    if (request.file) {
      return this.verifyFile(request.file, request.metadata);
    } else if (request.url) {
      return this.verifyUrl(request.url, request.metadata);
    } else {
      throw new Error('Either file or URL must be provided');
    }
  }

  private verifyFile(file: File, metadata?: any): Observable<VerificationResult> {
    return this.apiService.uploadFile<VerificationResult>('/api/v1/verification/upload', file, metadata).pipe(
      map(response => response.data)
    );
  }

  private verifyUrl(url: string, metadata?: any): Observable<VerificationResult> {
    return this.apiService.post<VerificationResult>('/api/v1/verification/url', {
      url,
      metadata
    }).pipe(
      map(response => response.data)
    );
  }

  getProofDetails(proofId: string): Observable<ProofDetails> {
    return this.apiService.get<ProofDetails>(`/api/v1/verification/proof/${proofId}`).pipe(
      map(response => response.data)
    );
  }

  setVerificationResult(result: VerificationResult): void {
    this.verificationResultSubject.next(result);
  }

  getCurrentVerificationResult(): VerificationResult | null {
    return this.verificationResultSubject.value;
  }

  clearVerificationResult(): void {
    this.verificationResultSubject.next(null);
  }
}
