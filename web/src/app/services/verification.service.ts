import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CreateProofFromUrlRequest {
    url: string;
}

export interface CreateProofFromUrlResponse {
    proofId: string;
    trustmarkId: string;
    verifyUrl: string;
    deduped: boolean;
}

export interface CreateProofFromFileRequest {
    likenessOwnerName?: string;
    consentEvidenceUrl?: string;
}

export interface CreateProofFromFileResponse {
    proofId: string;
    trustmarkId: string;
    verifyUrl: string;
    assetId: string;
    assetReused: boolean;
}

export interface VerifyProofResponse {
    trustmarkId: string;
    origin: {
        c2pa: boolean;
        status: string;
        claimGenerator?: string;
        issuer?: string;
        timestamp?: string;
        sha256?: string;
    };
    policy: {
        result: string;
        details: any[];
    };
    receipt: {
        pdfUrl?: string;
        json?: any;
        signature?: string;
        signerPubKey?: string;
    };
    createdAt: string;
}

export interface VerificationStep {
    step: string;
    message: string;
    completed: boolean;
    error?: string;
}

@Injectable({
    providedIn: 'root'
})
export class VerificationService {
    private readonly apiUrl = environment.apiUrl || 'http://localhost:5080';
    private verificationStepsSubject = new BehaviorSubject<VerificationStep[]>([]);
    public verificationSteps$ = this.verificationStepsSubject.asObservable();

    constructor(private http: HttpClient) { }

    createProofFromUrl(url: string, idempotencyKey?: string): Observable<CreateProofFromUrlResponse> {
        this.updateSteps([
            { step: 'starting', message: 'Starting verification...', completed: false },
            { step: 'canonicalizing', message: 'Analyzing URL...', completed: false },
            { step: 'checking', message: 'Checking for existing proof...', completed: false },
            { step: 'verifying', message: 'Verifying C2PA manifest...', completed: false },
            { step: 'creating', message: 'Creating proof and receipt...', completed: false }
        ]);

        const headers = new HttpHeaders();
        if (idempotencyKey) {
            headers.set('Idempotency-Key', idempotencyKey);
        }

        return this.http.post<CreateProofFromUrlResponse>(
            `${this.apiUrl}/v1/proofs/url`,
            { url },
            { headers }
        );
    }

    createProofFromFile(file: File, request: CreateProofFromFileRequest = {}): Observable<CreateProofFromFileResponse> {
        this.updateSteps([
            { step: 'starting', message: 'Starting file verification...', completed: false },
            { step: 'uploading', message: 'Uploading file...', completed: false },
            { step: 'hashing', message: 'Computing file hash...', completed: false },
            { step: 'checking', message: 'Checking for existing asset...', completed: false },
            { step: 'creating', message: 'Creating proof and receipt...', completed: false }
        ]);

        const formData = new FormData();
        formData.append('file', file);
        if (request.likenessOwnerName) {
            formData.append('likenessOwnerName', request.likenessOwnerName);
        }
        if (request.consentEvidenceUrl) {
            formData.append('consentEvidenceUrl', request.consentEvidenceUrl);
        }

        return this.http.post<CreateProofFromFileResponse>(
            `${this.apiUrl}/v1/proofs/file-upload`,
            formData
        );
    }

    verifyProof(trustmarkId: string): Observable<VerifyProofResponse> {
        return this.http.get<VerifyProofResponse>(`${this.apiUrl}/v1/verify-trustmark/${trustmarkId}`);
    }

    updateSteps(steps: VerificationStep[]): void {
        this.verificationStepsSubject.next(steps);
    }

    completeStep(stepName: string): void {
        const currentSteps = this.verificationStepsSubject.value;
        const updatedSteps = currentSteps.map(step =>
            step.step === stepName ? { ...step, completed: true } : step
        );
        this.verificationStepsSubject.next(updatedSteps);
    }

    setError(stepName: string, error: string): void {
        const currentSteps = this.verificationStepsSubject.value;
        const updatedSteps = currentSteps.map(step =>
            step.step === stepName ? { ...step, error } : step
        );
        this.verificationStepsSubject.next(updatedSteps);
    }

    clearSteps(): void {
        this.verificationStepsSubject.next([]);
    }
}
