import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { VerificationRequest, VerificationResult, ProofDetails, CreateProofRequest, CreateProofResponse, VerifyResponse } from '../models';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class VerificationService {
  private verificationResultSubject = new BehaviorSubject<VerificationResult | null>(null);
  public verificationResult$ = this.verificationResultSubject.asObservable();

  constructor(private apiService: ApiService) {}

  // New API methods matching your specification
  createProofFromUrl(url: string, generator: string, prompt: string, license: string): Observable<CreateProofResponse> {
    console.log('🔗 VerificationService.createProofFromUrl called with:', { url, generator, prompt, license });
    
    const request: CreateProofRequest = {
      input: { url },
      declared: { generator, prompt, license }
    };
    
    console.log('📤 Sending request to API:', request);
    
    return this.apiService.post<CreateProofResponse>('/v1/proofs', request).pipe(
      map(response => {
        console.log('📥 API Response received:', response);
        console.log('📥 Extracted data:', response.data);
        // The API returns the data directly, not wrapped in a data property
        return response.data || response;
      })
    );
  }

  createProofFromFile(file: File, generator: string, prompt: string, license: string): Observable<CreateProofResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('declared', JSON.stringify({ generator, prompt, license }));
    
    return this.apiService.post<CreateProofResponse>('/v1/proofs/file', formData).pipe(
      map(response => response.data || response)
    );
  }

  verifyProof(proofId: string): Observable<VerifyResponse> {
    return this.apiService.get<VerifyResponse>(`/v1/verify/${proofId}`).pipe(
      map(response => response.data || response)
    );
  }

  // Legacy methods for backward compatibility
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
